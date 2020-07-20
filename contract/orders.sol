pragma solidity ^0.6.6;

// SPDX-License-Identifier: GPL-3.0 pragma solidity >=0.4.16 <0.7.0;

import "../common/math.sol";
import "./types.sol";

library CycleList {

    struct RecordOfDay {
        uint256 len;
        uint256 timestemp;
        uint256[] list;
    }

    struct List {
        mapping(uint256=>RecordOfDay) maps;
    }

    function getDay(uint256 time, uint256 n) internal pure returns (uint256, uint256) {
        uint256 index = time % (n * 86400) / 86400;
        return (index % n, time - time % 86400);
    }

    function insert(List storage self, uint256 key) internal returns (uint256[] memory ret) {
        (uint256 index, uint256 time) = getDay(block.timestamp, 15);
        RecordOfDay storage record = self.maps[index];
        if (record.timestemp != 0) {
            if (time == record.timestemp) {
                if (record.len < record.list.length) {
                    record.list[record.len] = key;
                } else {
                    record.list.push(key);
                }
                record.len++;
            } else {
                ret = new uint256[](record.len);
                for(uint256 i=0;i<record.len;i++) {
                    ret[i] = record.list[i];
                }
                record.timestemp = time;
                record.list[0] = key;
                record.len = 1;
                return ret;
            }
        } else {
            record.timestemp = time;
            record.list.push(key);
            record.len = 1;
        }
    }

    function list(List storage self) internal view returns(uint256[] memory ret) {
        uint256 len;
        for(uint256 i=0;i<15;i++) {
            len += self.maps[i].len;
        }

        ret = new uint256[](len);
        uint256 index;
        for(uint256 i=0;i<15;i++) {
            RecordOfDay memory record = self.maps[i];
            if(record.len > 0) {
                for(uint256 j = 0;j< record.len;j++) {
                    ret[index++] = record.list[j];
                }
            }
        }
        return ret;
    }
}

library OrderPlatform {

    using CycleList for CycleList.List;
    using SafeMath for uint256;

    struct RelationList {
        uint256 count;
        uint256[] list;
        mapping(uint256=>bool) contains;
    }


    struct DB {
        uint256 seq;
        mapping(uint256 => Types.BusinessOrder) businessOrdersMap; //id => order
        mapping(address => CycleList.List) businessOwnerOrderMap; //address => ids
        mapping(bytes32 => CycleList.List) businessOrders;
        mapping(uint256 => RelationList) relationsMap;

        mapping(uint256 => Types.UserOrder) userOrdersMap; //id => order
        mapping(address => CycleList.List) userOwnerOrderMap;

        mapping(uint256 => bytes[]) ordersKyc;
    }

    function userOrderListByBId(DB storage self, uint256 businessOrderId) internal view returns (uint256[] memory ids , Types.UserOrder[] memory orders) {
        ids = self.relationsMap[businessOrderId].list;
        orders = new Types.UserOrder[](ids.length);
        for(uint256 i=0;i<ids.length;i++) {
            orders[i] = self.userOrdersMap[ids[i]];
        }
    }

    function userOrderList(DB storage self, address owner) internal view returns (uint256[] memory ids , Types.UserOrder[] memory orders) {
        ids = self.userOwnerOrderMap[owner].list();
        orders = new Types.UserOrder[](ids.length);
        for(uint256 i=0;i<ids.length;i++) {
            orders[i] = self.userOrdersMap[ids[i]];
        }
    }

    function businessOrderList(DB storage self, address owner, bytes32 key) internal view returns (uint256[] memory ids,Types.BusinessOrder[] memory orders) {
        if(owner == address(0)) {
            ids = self.businessOrders[key].list();
        } else {
            ids = self.businessOwnerOrderMap[owner].list();
        }

        orders = new Types.BusinessOrder[](ids.length);
        for(uint256 i=0;i<ids.length;i++) {
            orders[i] = self.businessOrdersMap[ids[i]];
        }
    }

    function refuse(DB storage self, uint256 userOrderId) internal {
        Types.UserOrder storage userOrder = self.userOrdersMap[userOrderId];

        if(userOrder.status == Types.OrderStatus.confirmed) {
            Types.BusinessOrder storage businessOrder = self.businessOrdersMap[userOrder.businessOrderId];
            businessOrder.lockinValue = businessOrder.lockinValue.sub(userOrder.value);
        }

        userOrder.status = Types.OrderStatus.refused;
        userOrder.updateTime = block.timestamp;


        removeRelationList(self, userOrder.businessOrderId, userOrderId);
    }

    function confirmed(DB storage self, uint256 orderId, bytes memory mcode) internal {
        Types.UserOrder storage userOrder = self.userOrdersMap[orderId];
        Types.BusinessOrder storage businessOrder = self.businessOrdersMap[userOrder.businessOrderId];

        require(businessOrder.value.sub(businessOrder.dealtValue).sub(businessOrder.lockinValue) >= userOrder.value);
        businessOrder.lockinValue =  businessOrder.lockinValue.add(userOrder.value);

        userOrder.status = Types.OrderStatus.confirmed;
        userOrder.updateTime = block.timestamp;

        self.ordersKyc[orderId].push(mcode);
    }

    function finished(DB storage self, uint256 userOrderId) internal returns(address) {
        Types.UserOrder storage userOrder = self.userOrdersMap[userOrderId];

        userOrder.status = Types.OrderStatus.finished;
        userOrder.updateTime = block.timestamp;

        Types.BusinessOrder storage businessOrder = self.businessOrdersMap[userOrder.businessOrderId];

        uint256 dealValue = self.userOrdersMap[userOrderId].value;

        businessOrder.lockinValue = businessOrder.lockinValue.sub(dealValue);
        businessOrder.dealtValue = businessOrder.dealtValue.add(dealValue);

        removeRelationList(self, userOrder.businessOrderId, userOrderId);

        if(userOrder.orderType == Types.OrderType.sell) {
            return businessOrder.owner;
        } else {
            return userOrder.owner;
        }
    }

    function userCancel(DB storage self, uint256 userOrderId) internal {
        Types.UserOrder storage userOrder = self.userOrdersMap[userOrderId];

        require(userOrder.owner == msg.sender);
        require(userOrder.status == Types.OrderStatus.waitConfirmed);

        userOrder.status = Types.OrderStatus.canceled;
        userOrder.updateTime = now;

        removeRelationList(self, userOrder.businessOrderId, userOrderId);
    }

    function arbitrate(DB storage self, uint256 userOrderId, Types.OrderStatus status) internal returns(address){
        Types.UserOrder storage userOrder = self.userOrdersMap[userOrderId];
        userOrder.status = status;
        userOrder.updateTime = block.timestamp;
        Types.BusinessOrder storage businessOrder = self.businessOrdersMap[userOrder.businessOrderId];

        if(status == Types.OrderStatus.finished) {
            uint256 dealValue = self.userOrdersMap[userOrderId].value;
            businessOrder.lockinValue = businessOrder.lockinValue.sub(dealValue);
            businessOrder.dealtValue = businessOrder.dealtValue.add(dealValue);
        } else {
            businessOrder.lockinValue = businessOrder.lockinValue.sub(userOrder.value);
        }

        removeRelationList(self, userOrder.businessOrderId, userOrderId);

        return businessOrder.owner;
    }

    function removeRelationList(DB storage self, uint256 businessOrderId, uint256 userOrderId) internal {
        delete self.relationsMap[businessOrderId].contains[userOrderId];
        self.relationsMap[businessOrderId].count = self.relationsMap[businessOrderId].count.sub(1);
    }

    function insertBusinessOrder(DB storage self, Types.BusinessOrder memory order) internal {
        uint256 orderId = ++self.seq;
        self.businessOrdersMap[orderId] = order;

        uint256[] memory ids = self.businessOwnerOrderMap[order.owner].insert(orderId);
        for(uint256 i=0;i<ids.length;i++) {
            if(self.businessOrdersMap[ids[i]].status == Types.OrderStatus.canceled ||
            self.businessOrdersMap[ids[i]].value == self.businessOrdersMap[ids[i]].dealtValue) {
                delete self.businessOrdersMap[ids[i]];
                delete self.relationsMap[orderId].list;
            } else {
                self.businessOwnerOrderMap[order.owner].insert(ids[i]);
            }
        }

        bytes32 key = keccak256(abi.encodePacked(order.token, order.unit));

        ids = self.businessOrders[key].insert(orderId);

        for(uint256 i=0;i<ids.length;i++) {
            if(self.businessOrdersMap[ids[i]].status == Types.OrderStatus.underway &&
            self.businessOrdersMap[ids[i]].value > self.businessOrdersMap[ids[i]].dealtValue) {
                self.businessOrders[key].insert(ids[i]);
            }
        }
    }

    function insertUserOrder(DB storage self, Types.UserOrder memory order, bytes memory mcode) internal {
        uint256 orderId = ++self.seq;
        self.relationsMap[order.businessOrderId].list.push(orderId);
        self.relationsMap[order.businessOrderId].contains[orderId] = true;
        self.relationsMap[order.businessOrderId].count += 1;

        self.ordersKyc[orderId].push(mcode);

        uint256[] memory ids = self.userOwnerOrderMap[order.owner].insert(orderId);
        for(uint256 i=0;i<ids.length;i++) {
            Types.UserOrder memory userOrder = self.userOrdersMap[ids[i]];
            if(userOrder.status == Types.OrderStatus.canceled ||
            userOrder.status == Types.OrderStatus.refused||
            userOrder.status == Types.OrderStatus.finished
            ) {
                delete self.userOrdersMap[ids[i]];
                delete self.ordersKyc[ids[i]];
            } else {
                self.userOwnerOrderMap[order.owner].insert(ids[i]);
            }
        }
        self.userOrdersMap[orderId] = order;

    }

    function checkBOPOrder(DB storage self, address owner, uint256 userOrderId, Types.OrderStatus status) internal view returns(bool) {
        Types.UserOrder memory userOrder = self.userOrdersMap[userOrderId];

        if(userOrder.status != status) {
            return false;
        }

        Types.BusinessOrder memory order = self.businessOrdersMap[userOrder.businessOrderId];
        if(order.owner != owner) {
            return false;
        }

        return self.relationsMap[userOrder.businessOrderId].contains[userOrderId];
    }

    function checkUOPOrder(DB storage self, address owner, uint256 userOrderId, Types.OrderStatus status) internal view returns(bool) {
        Types.UserOrder memory userOrder = self.userOrdersMap[userOrderId];

        if(userOrder.owner == owner && userOrder.status == status ) {
            return true;
        }
        return false;
    }
}