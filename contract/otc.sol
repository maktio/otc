pragma solidity ^0.6.6;
pragma experimental ABIEncoderV2;
// SPDX-License-Identifier: GPL-3.0 pragma solidity >=0.4.16 <0.7.0;

import "./orders.sol";
import "../common/math.sol";
import "../common/strings.sol";
import "../common/array.sol";
import "./types.sol";

contract SeroInterface {

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

    function addManager(address _manager) public onlyOwner {
        managers[_manager] = 2;
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
        uint64 deals;
        uint64 userRoleArbitrates;
        uint64 businessRoleArbitrates;
        uint8[] labels;
    }


    struct RetAuditedInfo {
        bytes32 hcode;
        bytes pcode;
    }

    uint256 constant OUTTIME = 60 * 60;

    mapping(bytes32 => Kyc) private kycs; //hcode => Kyc
    mapping(address => bytes32) private kycsMap; //address => hcode

    mapping(address => bytes32) ecodesMap;
    mapping(bytes32 => bool) private hasAuditedMap;
    mapping(bytes32 => bytes) private codesMap;
    Array.List private needAuditingList;

    mapping(bytes32 => bool) private tokenMap;
    Array.List private arbitrateList;

    uint256 chargeRate = 10;

    event OrderLog(bytes32 token, uint256 value, uint256 price, uint8 unit, uint8 orderType, uint64 timeStamp);

    constructor(address _auditor) public {
        auditor = _auditor;
    }

    function orderInfo(uint256 id) public view returns (Types.RetUserOrder memory ret) {
        ret.id = id;
        ret.order = orderPlatform.userOrdersMap[id];
        Types.BusinessOrder memory businessOrder = orderPlatform.businessOrdersMap[ret.order.businessOrderId];
        ret.unit = businessOrder.unit;
    }

    function arbitrateOrders() public view returns (Types.RetUserOrder[] memory rets){
        bytes32[] memory ids = arbitrateList.list();
        rets = new Types.RetUserOrder[](ids.length);

        for (uint256 i = 0; i < ids.length; i++) {
            rets[i].id = uint256(ids[i]);
            rets[i].order = orderPlatform.userOrdersMap[rets[i].id];
            Types.BusinessOrder memory businessOrder = orderPlatform.businessOrdersMap[rets[i].order.businessOrderId];
            rets[i].unit = businessOrder.unit;
        }
    }

    function auditingList() public view returns (RetAuditedInfo[] memory rets) {
        bytes32[] memory hcodes = needAuditingList.list();
        rets = new RetAuditedInfo[](hcodes.length);
        for (uint256 i = 0; i < hcodes.length; i++) {
            rets[i] = RetAuditedInfo({hcode : hcodes[i], pcode : codesMap[hcodes[i]]});
        }
    }

    function myKyc() public view returns (bytes32, uint8, Kyc memory) {
        uint8 status;
        if (hasAuditedMap[kycsMap[msg.sender]]) {
            status = 2;
        } else if (codesMap[kycsMap[msg.sender]].length > 0) {
            status = 1;
        }
        return (ecodesMap[msg.sender], status, kycs[kycsMap[msg.sender]]);
    }

    function userOrderList() public view returns (Types.RetUserOrder[] memory rets) {
        rets = orderPlatform.userOrderList(msg.sender);

        for (uint256 i = 0; i < rets.length; i++) {

            Types.BusinessOrder memory businessOrder = orderPlatform.businessOrdersMap[rets[i].order.businessOrderId];
            Kyc memory kyc = kycs[kycsMap[businessOrder.owner]];

            rets[i].name = kyc.name;
            rets[i].arbitration = kyc.businessRoleArbitrates;
            rets[i].hcode = kycsMap[businessOrder.owner];
            rets[i].unit = businessOrder.unit;
        }
    }

    function userOrderListByBId(uint256 bid) public view returns (Types.RetUserOrder[] memory rets) {
        Types.BusinessOrder memory businessOrder = orderPlatform.businessOrdersMap[bid];
        if (msg.sender != businessOrder.owner) {
            return new Types.RetUserOrder[](0);
        }

        rets = orderPlatform.userOrderListByBId(bid);

        for (uint256 i = 0; i < rets.length; i++) {
            Types.UserOrder memory userOrder = rets[i].order;
            Kyc memory kyc = kycs[kycsMap[userOrder.owner]];

            rets[i].name = kyc.name;
            rets[i].arbitration = kyc.userRoleArbitrates;
            rets[i].hcode = kycsMap[userOrder.owner];
            rets[i].unit = businessOrder.unit;
        }
    }

    function businessOrderList(string memory tokenName, uint8 unit, bool myself) public view returns (Types.RetBusinessOrder[] memory rets){
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
                underwayCount : orderPlatform.relationsMap[ids[i]].count,
                arbitration : kyc.businessRoleArbitrates, labels : kyc.labels});
        }
    }

    function setToken(string memory token, uint8 unit, bool flag) public onlyOwner {
        bytes32 key = keccak256(abi.encodePacked(token, unit));
        tokenMap[key] = flag;
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

    function addLabel(bytes32 hcode, uint8 label) public onlyAuditor {
        kycs[hcode].labels.push(label);
    }

    function needAuditing(bytes memory pcode) public {
        bytes32 hcode = kycsMap[msg.sender];
        require(hcode != bytes32(0));
        needAuditingList.push(hcode);
        codesMap[hcode] = pcode;
    }

    function registerKyc(string memory name, bytes32 hcode, bytes32 ecode, bytes memory pcode) public {
        require(bytes(name).length > 0);

        kycsMap[msg.sender] = hcode;

        if (ecode != bytes32(0)) {
            ecodesMap[msg.sender] = ecode;
        }

        if (bytes(kycs[hcode].name).length == 0) {
            kycs[hcode] = Kyc({name : name, deals : 0, labels : new uint8[](0),
                userRoleArbitrates : 0, businessRoleArbitrates : 0});

            if (pcode.length > 0 && !hasAuditedMap[hcode]) {
                needAuditing(pcode);
            }
        } else {
            kycs[hcode].name = name;
        }
    }

    function arbitrate(uint256 userOrderId) public onlyArbitrater {
        Types.UserOrder storage userOrder = orderPlatform.userOrdersMap[userOrderId];
        require(userOrder.status == Types.OrderStatus.confirmed);
        userOrder.status = Types.OrderStatus.arbitrate;
        arbitrateList.push(bytes32(userOrderId));
    }

    function executeArbitrate(uint256 userOrderId, uint8 winRole) public onlyArbitrater {
        Types.UserOrder memory userOrder = orderPlatform.userOrdersMap[userOrderId];
        require(userOrder.status == Types.OrderStatus.arbitrate);

        address business;
        if (winRole == 1) {
            if (userOrder.orderType == Types.OrderType.sell) {
                business = orderPlatform.arbitrate(userOrderId, Types.OrderStatus.finished);
                sendToken(business, strings._bytes32ToStr(userOrder.token), userOrder.value);
            } else {
                orderPlatform.arbitrate(userOrderId, Types.OrderStatus.refused);
            }
            kycs[kycsMap[userOrder.owner]].userRoleArbitrates++;
        } else {
            if (userOrder.orderType == Types.OrderType.sell) {
                business = orderPlatform.arbitrate(userOrderId, Types.OrderStatus.canceled);
            } else {
                business = orderPlatform.arbitrate(userOrderId, Types.OrderStatus.finished);
            }
            sendToken(userOrder.owner, strings._bytes32ToStr(userOrder.token), userOrder.value);
            kycs[kycsMap[business]].businessRoleArbitrates++;
        }
        arbitrateList.delVal(bytes32(userOrderId));
    }

    function exchangeBuy(bytes memory mcode, uint256 orderId, uint256 value, uint8 payType) public {
        require(kycsMap[msg.sender] != bytes32(0));
        Types.BusinessOrder memory order = orderPlatform.businessOrdersMap[orderId];
        require(value != 0);
        require(order.status == Types.OrderStatus.underway);
        require(order.orderType == Types.OrderType.sell);
        require(order.minDealValue <= value && value <= order.maxDealValue);
        require(order.value.sub(order.dealtValue).sub(order.lockinValue) >= value);

        orderPlatform.insertUserOrder(Types.UserOrder({
            owner : msg.sender,
            businessOrderId : orderId,
            value : value,
            token : order.token,
            price : order.price,
            createTime : now,
            updateTime : now,
            payType : payType,
            status : Types.OrderStatus.waitConfirmed,
            orderType : Types.OrderType.buy
            }), mcode);
    }

    function exchangeSell(bytes memory mcode, uint256 orderId, uint8 payType) public payable {
        require(kycsMap[msg.sender] != bytes32(0));
        bytes32 token = strings._stringToBytes32(sero_msg_currency());
        uint256 value = msg.value;

        Types.BusinessOrder memory order = orderPlatform.businessOrdersMap[orderId];
        require(value != 0);
        require(order.value != 0);
        require(token == order.token);
        require(order.status == Types.OrderStatus.underway);
        require(order.orderType == Types.OrderType.buy);
        require(order.minDealValue <= value && value <= order.maxDealValue);
        require(order.value.sub(order.dealtValue).sub(order.lockinValue) >= value);

        orderPlatform.insertUserOrder(Types.UserOrder({
            owner : msg.sender,
            businessOrderId : orderId,
            value : value,
            price : order.price,
            token : token,
            createTime : now,
            updateTime : now,
            payType : payType,
            status : Types.OrderStatus.waitConfirmed,
            orderType : Types.OrderType.sell}), mcode);
    }

    function refused(uint256 userOrderId) public {
        Types.UserOrder memory userOrder = orderPlatform.userOrdersMap[userOrderId];

        require(orderPlatform.checkBOPOrder(msg.sender, userOrderId, Types.OrderStatus.waitConfirmed) ||
            orderPlatform.checkBOPOrder(msg.sender, userOrderId, Types.OrderStatus.confirmed) &&
            (now - userOrder.updateTime) > OUTTIME);


        orderPlatform.refuse(userOrderId);
        if (userOrder.orderType == Types.OrderType.sell) {
            sero_send_token(userOrder.owner, strings._bytes32ToStr(userOrder.token), userOrder.value);
        }
    }

    function confirmed(uint256 userOrderId, bytes memory mcode) public {
        orderPlatform.checkBOPOrder(msg.sender, userOrderId, Types.OrderStatus.waitConfirmed);
        orderPlatform.confirmed(userOrderId, mcode);
    }

    function finished(uint256 userOrderId) public {
        Types.UserOrder memory userOrder = orderPlatform.userOrdersMap[userOrderId];
        Types.BusinessOrder memory businessOrder = orderPlatform.businessOrdersMap[userOrder.businessOrderId];

        if (userOrder.orderType == Types.OrderType.buy) {
            orderPlatform.checkBOPOrder(msg.sender, userOrderId, Types.OrderStatus.confirmed);
        } else {
            require(orderPlatform.checkUOPOrder(msg.sender, userOrderId, Types.OrderStatus.confirmed) ||
                (orderPlatform.checkBOPOrder(msg.sender, userOrderId, Types.OrderStatus.confirmed) &&
                (now - userOrder.updateTime) > OUTTIME));
        }

        address to = orderPlatform.finished(userOrderId);
        sendToken(to, strings._bytes32ToStr(userOrder.token), userOrder.value);

        kycs[kycsMap[businessOrder.owner]].deals++;
        kycs[kycsMap[userOrder.owner]].deals++;

        emit  OrderLog(userOrder.token, userOrder.value, userOrder.price, businessOrder.unit, uint8(userOrder.status), uint64(now));
    }


    function sendToken(address to, string memory tokenName, uint256 value) internal {
        if (chargeRate > 0) {
            uint256 fee = value.mul(chargeRate) / 10000;
            require(sero_send_token(owner, tokenName, fee));
            require(sero_send_token(to, tokenName, value.sub(fee)));
        } else {
            require(sero_send_token(to, tokenName, value));
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
        require(orderPlatform.relationsMap[orderId].count == 0);

        order.status = Types.OrderStatus.canceled;
        if (order.orderType == Types.OrderType.sell) {
            require(sero_send_token(msg.sender, strings._bytes32ToStr(order.token), order.value.sub(order.dealtValue)));
        }
    }

    function updatePrice(uint256 orderId, uint256 price) public {
        orderPlatform.updatePrice(orderId, price);
//        Types.BusinessOrder storage order = orderPlatform.businessOrdersMap[orderId];
//        require(order.status == Types.OrderStatus.underway);
//        require(order.owner == msg.sender);
//        order.price = price;
    }

    function businessBuy(string memory tokenName, uint256 value, uint256 minDealValue, uint256 maxDealVlaue, uint256 price, uint8 unit, string memory information) public {
        require(hasAuditedMap[kycsMap[msg.sender]]);
        require(tokenMap[keccak256(abi.encodePacked(tokenName, unit))]);

        require(value != 0);
        require(minDealValue <= maxDealVlaue);
        require(maxDealVlaue <= value);

        orderPlatform.insertBusinessOrder(Types.BusinessOrder({
            owner : msg.sender,
            value : value,
            token : strings._stringToBytes32(tokenName),
            dealtValue : 0,
            lockinValue : 0,
            minDealValue : minDealValue,
            maxDealValue : maxDealVlaue,
            price : price,
            unit : unit,
            createTime : now,
            status : Types.OrderStatus.underway,
            orderType : Types.OrderType.buy,
            information : information
            }));
    }

    function businessSell(uint256 minDealValue, uint256 maxDealVlaue, uint256 price, uint8 unit, string memory information) public payable {
        require(hasAuditedMap[kycsMap[msg.sender]]);
        require(tokenMap[keccak256(abi.encodePacked(sero_msg_currency(), unit))]);

        uint256 value = msg.value;
        require(value != 0);
        require(minDealValue <= maxDealVlaue);
        require(maxDealVlaue <= value);

        orderPlatform.insertBusinessOrder(Types.BusinessOrder({
            owner : msg.sender,
            value : value,
            token : strings._stringToBytes32(sero_msg_currency()),
            dealtValue : 0,
            lockinValue : 0,
            minDealValue : minDealValue,
            maxDealValue : maxDealVlaue,
            price : price,
            unit : unit,
            createTime : now,
            status : Types.OrderStatus.underway,
            orderType : Types.OrderType.sell,
            information : information
            }));
    }

}


