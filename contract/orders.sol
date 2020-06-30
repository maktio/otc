pragma solidity ^0.6.9;

// SPDX-License-Identifier: GPL-3.0 pragma solidity >=0.4.16 <0.7.0;

import "../common/math.sol";
import "./types.sol";

library CycleList {

    uint256 constant DAYS = 3;
    uint256 constant ONEDAY = 60*60;

    struct RecordOfDay {
        uint256 len;
        uint256 timestemp;
        uint256[] list;
    }

    struct List {
        mapping(uint256 => RecordOfDay) maps;
    }

    function getDay(uint256 time, uint256 n) internal pure returns (uint256, uint256) {
//        uint256 index = time % (n * 86400) / 86400;
//        return (index % n, time - time % 86400);

        uint256 index = time % (n * ONEDAY) / ONEDAY;
        return (index % n, time - time % ONEDAY);
    }

    function insert(List storage self, uint256 key) internal returns (uint256[] memory ret) {
        (uint256 index, uint256 time) = getDay(block.timestamp, DAYS);
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
                for (uint256 i = 0; i < record.len; i++) {
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

    function list(List storage self) internal view returns (uint256[] memory ret) {
        uint256 len;
        for (uint256 i = 0; i < DAYS; i++) {
            len += self.maps[i].len;
        }

        ret = new uint256[](len);
        uint256 index;
        for (uint256 i = 0; i < DAYS; i++) {
            RecordOfDay memory record = self.maps[i];
            if (record.len > 0) {
                for (uint256 j = 0; j < record.len; j++) {
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
    using Types for Types.OrderStatus;
    using Types for Types.OrderType;
    using Types for Types.UserOrder;
    using Types for Types.BusinessOrder;



    struct DB {
        uint256 seq;
        mapping(uint256 => Types.BusinessOrder) businessOrdersMap; //id => order
        mapping(address => CycleList.List) businessOwnerOrderMap; //address => ids
        mapping(bytes32 => CycleList.List) businessOrders;
        mapping(uint256 => uint256[]) relationList;

        mapping(address => CycleList.List) userOwnerOrderMap;
        mapping(uint256 => Types.UserOrder) userOrdersMap; //id => order
    }

    function userOrderListByBId(DB storage self, uint256 businessOrderId) internal view returns (uint256[] memory ids, Types.UserOrder[] memory orders) {
        ids = self.relationList[businessOrderId];
        orders = new Types.UserOrder[](ids.length);
        for (uint256 i = 0; i < ids.length; i++) {
            orders[i] = self.userOrdersMap[ids[i]];
        }
    }

    function userOrderList(DB storage self, address owner, bool flag) internal view returns (uint256[] memory ids, Types.UserOrder[] memory orders) {

        if (flag) {
            ids = self.userOwnerOrderMap[owner].list();
            orders = new Types.UserOrder[](ids.length);
            for (uint256 i = 0; i < ids.length; i++) {
                orders[i] = self.userOrdersMap[ids[i]];
            }
        } else {
            uint256 len;
            uint256[] memory bids = self.businessOwnerOrderMap[owner].list();
            for (uint256 i = 0; i < bids.length; i++) {
                len += self.relationList[bids[i]].length;
            }

            orders = new Types.UserOrder[](len);
            ids = new uint256[](len);
            uint256 index;
            for (uint256 i = 0; i < bids.length; i++) {
                for (uint256 j = 0; j < self.relationList[bids[i]].length; j++) {
                    uint256 id = self.relationList[bids[i]][j];
                    ids[index] = id;
                    orders[index++] = self.userOrdersMap[id];
                }
            }
        }
    }

    function businessOrderList(DB storage self, address owner, bytes32 key) internal view returns (uint256[] memory ids, Types.BusinessOrder[] memory orders) {
        if (owner == address(0)) {
            ids = self.businessOrders[key].list();
        } else {
            ids = self.businessOwnerOrderMap[owner].list();
        }

        orders = new Types.BusinessOrder[](ids.length);
        for (uint256 i = 0; i < ids.length; i++) {
            orders[i] = self.businessOrdersMap[ids[i]];
        }
    }

    function refuse(DB storage self, uint256 userOrderId) internal {
        Types.UserOrder storage userOrder = self.userOrdersMap[userOrderId];
        userOrder.status = Types.OrderStatus.refused;
        userOrder.updateTime = block.timestamp;
    }

    function confirmed(DB storage self, uint256 orderId) internal {
        Types.UserOrder storage userOrder = self.userOrdersMap[orderId];
        Types.BusinessOrder storage businessOrder = self.businessOrdersMap[userOrder.businessOrderId];

        require(businessOrder.value.sub(businessOrder.dealtValue).sub(businessOrder.lockinValue) >= userOrder.value);
        businessOrder.lockinValue = businessOrder.lockinValue.add(userOrder.value);

        userOrder.status = Types.OrderStatus.confirmed;
        userOrder.updateTime = block.timestamp;
    }

    function finished(DB storage self, uint256 userOrderId) internal returns (address) {
        Types.UserOrder storage userOrder = self.userOrdersMap[userOrderId];

        userOrder.status = Types.OrderStatus.finished;
        userOrder.updateTime = block.timestamp;

        Types.BusinessOrder storage businessOrder = self.businessOrdersMap[userOrder.businessOrderId];

        uint256 dealValue = self.userOrdersMap[userOrderId].value;

        businessOrder.lockinValue = businessOrder.lockinValue.sub(dealValue);
        businessOrder.dealtValue = businessOrder.dealtValue.add(dealValue);

        if (userOrder.orderType == Types.OrderType.sell) {
            return businessOrder.owner;
        } else {
            return userOrder.owner;
        }
    }

    function arbitrate(DB storage self, uint256 userOrderId, Types.OrderStatus status) internal returns (address){
        Types.UserOrder storage userOrder = self.userOrdersMap[userOrderId];
        userOrder.status = status;
        userOrder.updateTime = block.timestamp;
        Types.BusinessOrder storage businessOrder = self.businessOrdersMap[userOrder.businessOrderId];

        if (status == Types.OrderStatus.finished) {
            uint256 dealValue = self.userOrdersMap[userOrderId].value;
            businessOrder.lockinValue = businessOrder.lockinValue.sub(dealValue);
            businessOrder.dealtValue = businessOrder.dealtValue.add(dealValue);
        } else {
            businessOrder.lockinValue = businessOrder.lockinValue.sub(userOrder.value);
        }
        return businessOrder.owner;
    }

    function userCancel(DB storage self, uint256 userOrderId) internal returns (address, bytes32, uint256, Types.OrderType){
        Types.UserOrder storage userOrder = self.userOrdersMap[userOrderId];
        userOrder.status = Types.OrderStatus.canceled;
        userOrder.updateTime = block.timestamp;

        return (userOrder.owner, userOrder.token, userOrder.value, userOrder.orderType);
    }

    function insertBusinessOrder(DB storage self, address owner, Types.BusinessOrder memory order) internal {
        uint256 orderId = ++self.seq;
        self.businessOrdersMap[orderId] = order;

        uint256[] memory ids = self.businessOwnerOrderMap[owner].insert(orderId);
        for (uint256 i = 0; i < ids.length; i++) {
            if (self.businessOrdersMap[ids[i]].status == Types.OrderStatus.canceled ||
            self.businessOrdersMap[ids[i]].value == self.businessOrdersMap[ids[i]].dealtValue) {
                delete self.businessOrdersMap[ids[i]];
                delete self.relationList[ids[i]];
            } else {
                self.businessOwnerOrderMap[owner].insert(ids[i]);

            }
        }

        bytes32 key = keccak256(abi.encodePacked(order.token, order.unit));

        ids = self.businessOrders[key].insert(orderId);

        for (uint256 i = 0; i < ids.length; i++) {
            if (self.businessOrdersMap[ids[i]].status == Types.OrderStatus.underway &&
            self.businessOrdersMap[ids[i]].value > self.businessOrdersMap[ids[i]].dealtValue) {
                self.businessOrders[key].insert(ids[i]);
            }
        }
    }

    function insertUserOrder(DB storage self, address owner, Types.UserOrder memory order) internal returns (uint256, uint256[] memory){
        uint256 orderId = ++self.seq;
        self.relationList[order.businessOrderId].push(orderId);

        uint256[] memory ids = self.userOwnerOrderMap[owner].insert(orderId);
        for (uint256 i = 0; i < ids.length; i++) {
            Types.UserOrder memory userOrder = self.userOrdersMap[ids[i]];
            if (userOrder.status == Types.OrderStatus.canceled ||
            userOrder.status == Types.OrderStatus.refused ||
            userOrder.status == Types.OrderStatus.finished
            ) {
                delete self.userOrdersMap[ids[i]];
            } else {
                self.userOwnerOrderMap[owner].insert(ids[i]);
                ids[i] = 0;
            }
        }
        self.userOrdersMap[orderId] = order;
        return (orderId, ids);
    }

    function checkBOPOrder(DB storage self, address owner, uint256 userOrderId, Types.OrderStatus status) internal view returns (bool) {
        Types.UserOrder memory userOrder = self.userOrdersMap[userOrderId];

        require(userOrder.status == status);

        Types.BusinessOrder memory order = self.businessOrdersMap[userOrder.businessOrderId];
        require(order.owner == owner);

        bool flag;
        for (uint256 i = self.relationList[userOrder.businessOrderId].length; i > 0; i--) {
            if (userOrderId == self.relationList[userOrder.businessOrderId][i - 1]) {
                flag = true;
                break;
            }
        }
        require(flag);
        return true;
    }

    function checkUOPOrder(DB storage self, address owner, uint256 userOrderId, Types.OrderStatus status) internal view returns (bool) {
        Types.UserOrder memory userOrder = self.userOrdersMap[userOrderId];

        require(userOrder.owner == owner);
        require(userOrder.status == status);
        return true;
    }
}