pragma solidity ^0.6.9;
pragma experimental ABIEncoderV2;
// SPDX-License-Identifier: GPL-3.0 pragma solidity >=0.4.16 <0.7.0;

import "./orders.sol";
import "../common/math.sol";
import "../common/strings.sol";
import "../common/array.sol";
import "./types.sol";

contract SeroInterface {

    bytes32 private topic_sero_issueToken = 0x3be6bf24d822bcd6f6348f6f5a5c2d3108f04991ee63e80cde49a8c4746a0ef3;
    bytes32 private topic_sero_balanceOf = 0xcf19eb4256453a4e30b6a06d651f1970c223fb6bd1826a28ed861f0e602db9b8;
    bytes32 private topic_sero_send = 0x868bd6629e7c2e3d2ccf7b9968fad79b448e7a2bfb3ee20ed1acbc695c3c8b23;
    bytes32 private topic_sero_currency = 0x7c98e64bd943448b4e24ef8c2cdec7b8b1275970cfe10daf2a9bfa4b04dce905;

    function sero_msg_currency() internal returns (string memory) {
        bytes memory tmp = new bytes(32);
        bytes32 b32;
        assembly {
            log1(tmp, 0x20, sload(topic_sero_currency_slot))
            b32 := mload(tmp)
        }
        return strings._bytes32ToStr(b32);
    }

    function sero_issueToken(uint256 _total, string memory _currency) internal returns (bool success){
        bytes memory temp = new bytes(64);
        assembly {
            mstore(temp, _currency)
            mstore(add(temp, 0x20), _total)
            log1(temp, 0x40, sload(topic_sero_issueToken_slot))
            success := mload(add(temp, 0x20))
        }
    }

    function sero_balanceOf(string memory _currency) internal returns (uint256 amount){
        bytes memory temp = new bytes(32);
        assembly {
            mstore(temp, _currency)
            log1(temp, 0x20, sload(topic_sero_balanceOf_slot))
            amount := mload(temp)
        }
    }

    function sero_send_token(address _receiver, string memory _currency, uint256 _amount) internal returns (bool success){
        return sero_send(_receiver, _currency, _amount, "", 0);
    }

    function sero_send(address _receiver, string memory _currency, uint256 _amount, string memory _category, bytes32 _ticket) internal returns (bool success){
        bytes memory temp = new bytes(160);
        assembly {
            mstore(temp, _receiver)
            mstore(add(temp, 0x20), _currency)
            mstore(add(temp, 0x40), _amount)
            mstore(add(temp, 0x60), _category)
            mstore(add(temp, 0x80), _ticket)
            log1(temp, 0xa0, sload(topic_sero_send_slot))
            success := mload(add(temp, 0x80))
        }
    }

}

contract Role {
    address public owner;
    address public auditor;

    mapping(address => uint8) managers;

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    constructor() public {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner);
        _;
    }

    modifier onlyAuditor() {
        require(msg.sender == auditor
        || msg.sender == owner);
        _;
    }

    modifier onlyArbitrater() {
        require(msg.sender == owner || managers[msg.sender] == 2);
        _;
    }

    function setAuditor(address _auditor) public onlyOwner {
        auditor = _auditor;
    }

    function transferOwnership(address newOwner) public onlyOwner {
        require(newOwner != address(0));
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }

}

contract OTC is SeroInterface, Role {
    using SafeMath for uint256;
    using OrderPlatform for OrderPlatform.DB;
    using Types for Types.OrderStatus;
    using Types for Types.OrderType;
    using Types for Types.UserOrder;
    using Types for Types.BusinessOrder;
    using Array for Array.List;

    OrderPlatform.DB orderPlatform;

    struct Kyc {
        string name;
        bytes32 ecode;

        uint64 deals;
        uint64 userRoleArbitrates;
        uint64 businessRoleArbitrates;
        uint8[] labels;
    }


    struct RetAuditedInfo {
        bytes32 hcode;
        bytes32 pcode;
    }

    mapping(bytes32 => Kyc) private kycs; //hcode => Kyc
    mapping(address => bytes32) private kycsMap; //address => hcode

    mapping(bytes32 => bool) private tokenMap;

    mapping(bytes32 => bool) private hasAuditedMap;
    mapping(bytes32 => bytes32) private codesMap;
    Array.List private needAuditingList;

    mapping(uint256 => bytes32[]) private ordersKyc;//orderId => uesr_ecode,business_ecode

    constructor(address _auditor) public {
        auditor = _auditor;
    }


    function auditingList() public view returns (RetAuditedInfo[] memory rets) {
        bytes32[] memory hcodes = needAuditingList.list();
        rets = new RetAuditedInfo[](hcodes.length);
        for (uint256 i = 0; i < hcodes.length; i++) {
            rets[i] = RetAuditedInfo({hcode : hcodes[i], pcode : codesMap[hcodes[i]]});
        }
    }


    function addToken(string memory token) public onlyOwner {
        if (tokenMap[strings._stringToBytes32(token)]) {
            return;
        }
        tokenMap[strings._stringToBytes32(token)] = true;
    }

    function audited(bytes32[] memory hcodes, bool status) public onlyAuditor {
        for (uint256 i = 0; i < hcodes.length; i++) {
            bytes32 hcode = hcodes[i];
            hasAuditedMap[hcode] = status;
            needAuditingList.delVal(hcode);
            delete codesMap[hcode];
        }
    }


    function invalidAudited(bytes32 hcode) public onlyAuditor {
        hasAuditedMap[hcode] = false;
    }

    function addLable(bytes32 hcode, uint8 label) public onlyAuditor {
        kycs[hcode].labels.push(label);
    }


    function myKyc() public view returns (bytes32, bytes32, bool) {
        return (kycsMap[msg.sender], codesMap[kycsMap[msg.sender]], hasAuditedMap[kycsMap[msg.sender]]);
    }

    function needAuditing(bytes32 pcode) public {
        bytes32 hcode = kycsMap[msg.sender];
        require(hcode != bytes32(0));
        needAuditingList.push(hcode);
        codesMap[hcode] = pcode;
    }

    function registerKyc(string memory name, bytes32 hcode, bytes32 ecode, bytes32 pcode) public {
        kycsMap[msg.sender] = hcode;

        if (kycs[hcode].ecode == bytes32(0)) {
            kycs[hcode] = Kyc({name : name, ecode : ecode, deals : 0, labels : new uint8[](0),
                userRoleArbitrates : 0, businessRoleArbitrates : 0});

            if (pcode != bytes32(0) && !hasAuditedMap[hcode]) {
                needAuditing(pcode);
            }
        }
    }

    function userOrders(bool myself) public view returns (Types.RetUserOrder[] memory rets) {
        (uint256[] memory ids, Types.UserOrder[] memory orders) = orderPlatform.userOrderList(msg.sender, myself);

        rets = new Types.RetUserOrder[](ids.length);
        for (uint256 i = 0; i < ids.length; i++) {
            Types.UserOrder memory userOrder = orders[i];
            Types.BusinessOrder memory businessOrder = orderPlatform.businessOrdersMap[userOrder.businessOrderId];
            Kyc memory kyc = kycs[kycsMap[userOrder.owner]];
            if (myself) {
                rets[i] = Types.RetUserOrder({id : ids[i], order : userOrder, name : kyc.name, arbitration : kyc.userRoleArbitrates, hcode : kycsMap[businessOrder.owner], ecode : ordersKyc[ids[i]][1]});
            } else {
                rets[i] = Types.RetUserOrder({id : ids[i], order : userOrder, name : kyc.name, arbitration : kyc.userRoleArbitrates, hcode : kycsMap[userOrder.owner], ecode : ordersKyc[ids[i]][0]});
            }
        }
    }

    function userOrderListByBId(uint256 bid) public view returns (Types.RetUserOrder[] memory rets) {
        Types.BusinessOrder memory businessOrder = orderPlatform.businessOrdersMap[bid];
        if (msg.sender != businessOrder.owner) {
            return new Types.RetUserOrder[](0);
        }

        (uint256[] memory ids, Types.UserOrder[] memory orders) = orderPlatform.userOrderListByBId(bid);

        rets = new Types.RetUserOrder[](ids.length);
        for (uint256 i = 0; i < ids.length; i++) {
            Types.UserOrder memory userOrder = orders[i];
            Kyc memory kyc = kycs[kycsMap[userOrder.owner]];

            rets[i] = Types.RetUserOrder({id : ids[i], order : userOrder, name : kyc.name, arbitration : kyc.userRoleArbitrates, hcode : kycsMap[userOrder.owner], ecode : ordersKyc[ids[i]][0]});
        }
    }

    function businessOrders(string memory tokenName, uint8 unit, bool myself) public view returns (Types.RetBusinessOrder[] memory rets){
        uint256[] memory ids;
        Types.BusinessOrder[] memory orders;

        if (myself) {
            (ids, orders) = orderPlatform.businessOrderList(msg.sender, 0);
        } else {
            bytes32 key = keccak256(abi.encodePacked(strings._stringToBytes32(tokenName), unit));
            (ids, orders) = orderPlatform.businessOrderList(address(0), key);
        }

        rets = new Types.RetBusinessOrder[](ids.length);
        for (uint256 i = 0; i < ids.length; i++) {
            Types.BusinessOrder memory order = orders[i];
            Kyc memory kyc = kycs[kycsMap[order.owner]];

            rets[i] = Types.RetBusinessOrder({id : ids[i], order : orders[i],
                name : kyc.name,
                hcode : kycsMap[order.owner],
                deals : kyc.deals,
                arbitration : kyc.businessRoleArbitrates, labels : kyc.labels});
        }
    }

    function exchangeBuy(bytes32 mcode, uint256 orderId, uint256 value) public {
        require(kycsMap[msg.sender] != bytes32(0));
        Types.BusinessOrder memory order = orderPlatform.businessOrdersMap[orderId];
        require(order.status == Types.OrderStatus.underway);
        require(order.orderType == Types.OrderType.sell);
        require(order.minDealValue <= value && value <= order.maxDealValue);
        require(order.value - order.dealtValue - order.lockinValue >= value);

        (uint256 id, uint256[] memory ids) = orderPlatform.insertUserOrder(msg.sender, Types.UserOrder({
            owner : msg.sender,
            businessOrderId : orderId,
            value : value,
            token : order.token,
            price : order.price,
            createTime : now,
            updateTime : now,
            status : Types.OrderStatus.waitConfirmed,
            orderType : Types.OrderType.buy
            }));

        ordersKyc[id] = [mcode, 0];
        for (uint256 i = 0; i < ids.length; i++) {
            delete ordersKyc[ids[i]];
        }
    }

    function exchangeSell(bytes32 mcode, uint256 orderId) public payable {
        require(kycsMap[msg.sender] != bytes32(0));
        bytes32 token = strings._stringToBytes32(sero_msg_currency());
        uint256 value = msg.value;

        Types.BusinessOrder memory order = orderPlatform.businessOrdersMap[orderId];
        require(order.value != 0);
        require(token == order.token);
        require(order.status == Types.OrderStatus.underway);
        require(order.orderType == Types.OrderType.buy);
        require(order.minDealValue <= value && value <= order.maxDealValue);
        require(order.value - order.dealtValue - order.lockinValue >= value);

        (uint256 id, uint256[] memory ids) = orderPlatform.insertUserOrder(msg.sender, Types.UserOrder({
            owner : msg.sender,
            businessOrderId : orderId,
            value : value,
            price : order.price,
            token : token,
            createTime : now,
            updateTime : now,
            status : Types.OrderStatus.waitConfirmed,
            orderType : Types.OrderType.sell}));

        ordersKyc[id] = [mcode, 0];
        for (uint256 i = 0; i < ids.length; i++) {
            delete ordersKyc[ids[i]];
        }
    }

    function refused(uint256 userOrderId) public {
        Types.UserOrder memory userOrder = orderPlatform.userOrdersMap[userOrderId];

        require(orderPlatform.checkBOPOrder(msg.sender, userOrderId, Types.OrderStatus.waitConfirmed) ||
            orderPlatform.checkBOPOrder(msg.sender, userOrderId, Types.OrderStatus.confirmed) &&
            (now - userOrder.updateTime) > 24 * 60 * 60);

        orderPlatform.refuse(userOrderId);
        if (userOrder.orderType == Types.OrderType.sell) {
            sero_send_token(userOrder.owner, strings._bytes32ToStr(userOrder.token), userOrder.value);
        }
    }

    function confirmed(uint256 userOrderId, bytes32 mcode) public {
        orderPlatform.checkBOPOrder(msg.sender, userOrderId, Types.OrderStatus.waitConfirmed);
        orderPlatform.confirmed(userOrderId);
        ordersKyc[userOrderId][1] = mcode;
    }

    function finished(uint256 userOrderId) public {
        Types.UserOrder memory userOrder = orderPlatform.userOrdersMap[userOrderId];
        if (userOrder.orderType == Types.OrderType.buy) {
            orderPlatform.checkBOPOrder(msg.sender, userOrderId, Types.OrderStatus.confirmed);
        } else {
            require(orderPlatform.checkUOPOrder(msg.sender, userOrderId, Types.OrderStatus.confirmed) ||
                (orderPlatform.checkBOPOrder(msg.sender, userOrderId, Types.OrderStatus.confirmed) &&
                (now - userOrder.updateTime) > 24 * 60 * 60));
        }

        address sender = orderPlatform.finished(userOrderId);
        require(sero_send_token(sender, strings._bytes32ToStr(userOrder.token), userOrder.value));

        kycs[kycsMap[msg.sender]].deals++;
    }

    function orderInfo(uint256 userOrderId) public view returns (Types.UserOrder memory userOrder, Types.BusinessOrder memory businessOrder) {
        userOrder = orderPlatform.userOrdersMap[userOrderId];
        businessOrder = orderPlatform.businessOrdersMap[userOrder.businessOrderId];
    }

    function executeArbitrate(uint256 userOrderId, bool businessWin) public onlyArbitrater {
        Types.UserOrder memory userOrder = orderPlatform.userOrdersMap[userOrderId];
        require(userOrder.status == Types.OrderStatus.confirmed);

        address business;
        if (businessWin) {
            if (userOrder.orderType == Types.OrderType.sell) {
                business = orderPlatform.arbitrate(userOrderId, Types.OrderStatus.finished);
                require(sero_send_token(business, strings._bytes32ToStr(userOrder.token), userOrder.value));
            } else {
                orderPlatform.arbitrate(userOrderId, Types.OrderStatus.refused);
            }
            kycs[kycsMap[userOrder.owner]].userRoleArbitrates++;
        } else {
            if (userOrder.orderType == Types.OrderType.sell) {
                business = orderPlatform.arbitrate(userOrderId, Types.OrderStatus.canceled);
                require(sero_send_token(userOrder.owner, strings._bytes32ToStr(userOrder.token), userOrder.value));
            } else {
                business = orderPlatform.arbitrate(userOrderId, Types.OrderStatus.finished);
                require(sero_send_token(userOrder.owner, strings._bytes32ToStr(userOrder.token), userOrder.value));
            }
            kycs[kycsMap[business]].businessRoleArbitrates++;
        }
    }

    function userCancel(uint256 userOrderId) public {
        Types.UserOrder storage userOrder = orderPlatform.userOrdersMap[userOrderId];

        require(userOrder.owner == msg.sender);
        require(userOrder.status == Types.OrderStatus.waitConfirmed);

        userOrder.status = Types.OrderStatus.canceled;
        userOrder.updateTime = now;

        if (userOrder.orderType == Types.OrderType.sell) {
            require(sero_send_token(userOrder.owner, strings._bytes32ToStr(userOrder.token), userOrder.value));
        }
    }

    function businessCancel(uint256 orderId) public {
        Types.BusinessOrder storage order = orderPlatform.businessOrdersMap[orderId];
        require(order.status == Types.OrderStatus.underway);
        require(order.owner == msg.sender);

        bool flag;
        for (uint256 i = 0; i < orderPlatform.relationList[orderId].length; i++) {
            Types.UserOrder memory userOrder = orderPlatform.userOrdersMap[orderPlatform.relationList[orderId][i]];
            if (userOrder.status == Types.OrderStatus.underway ||
            userOrder.status == Types.OrderStatus.confirmed) {
                flag = true;
                break;
            }
        }
        require(!flag);

        order.status = Types.OrderStatus.canceled;
        if (order.orderType == Types.OrderType.sell) {
            require(sero_send_token(msg.sender, strings._bytes32ToStr(order.token), order.value.sub(order.dealtValue)));
        }
    }

    function updatePrice(uint256 orderId, uint256 price) public {
        Types.BusinessOrder storage order = orderPlatform.businessOrdersMap[orderId];
        require(order.status == Types.OrderStatus.underway);
        require(order.owner == msg.sender);
        order.price = price;
    }

    function businessBuy(string memory tokenName, uint256 value, uint256 minDealValue, uint256 maxDealVlaue, uint256 price, uint8 unit) public {
        require(hasAuditedMap[kycsMap[msg.sender]]);
        bytes32 token = strings._stringToBytes32(tokenName);
        require(tokenMap[token]);
        require(minDealValue <= maxDealVlaue);
        require(maxDealVlaue <= value);


        orderPlatform.insertBusinessOrder(msg.sender,
            Types.BusinessOrder({
            owner : msg.sender,
            value : value,
            token : token,
            dealtValue : 0,
            lockinValue : 0,
            minDealValue : minDealValue,
            maxDealValue : maxDealVlaue,
            price : price,
            unit : unit,
            timestemp : now,
            status : Types.OrderStatus.underway,
            orderType : Types.OrderType.buy
            }));
    }

    function businessSell(uint256 minDealValue, uint256 maxDealVlaue, uint256 price, uint8 unit) public payable {
        require(hasAuditedMap[kycsMap[msg.sender]]);
        bytes32 token = strings._stringToBytes32(sero_msg_currency());
        require(tokenMap[token]);


        uint256 value = msg.value;
        require(minDealValue <= maxDealVlaue);
        require(maxDealVlaue <= value);

        orderPlatform.insertBusinessOrder(msg.sender,
            Types.BusinessOrder({
            owner : msg.sender,
            value : value,
            token : token,
            dealtValue : 0,
            lockinValue : 0,
            minDealValue : minDealValue,
            maxDealValue : maxDealVlaue,
            price : price,
            unit : unit,
            timestemp : now,
            status : Types.OrderStatus.underway,
            orderType : Types.OrderType.sell
            }));
    }

}


