pragma solidity ^0.6.6;

// SPDX-License-Identifier: GPL-3.0 pragma solidity >=0.4.16 <0.7.0;

library Types {

    enum OrderStatus {underway, waitConfirmed, confirmed, refused, canceled, finished, arbitrate}
    enum OrderType {buy, sell}


    struct BusinessOrder {
        address owner;
        bytes32 token;
        uint256 value;
        uint256 dealtValue;
        uint256 lockinValue;
        uint256 minDealValue;
        uint256 maxDealValue;
        uint256 price;
        uint256 createTime;
        uint8 unit;
        OrderType orderType;
        OrderStatus status;
        string information;
    }

    struct UserOrder {
        address owner;
        uint256 businessOrderId;
        uint256 value;
        uint256 price;
        bytes32 token;
        uint256 createTime;
        uint256 updateTime;
        uint16 payType;
        OrderStatus status;
        OrderType orderType;
    }

    struct RetBusinessOrder {
        uint256 id;
        Types.BusinessOrder order;
        string name;
        bytes32 hcode;
        uint256 underwayCount;
        uint256 deals;
        uint256 arbitration;
        uint8[] labels;
    }

    struct RetUserOrder {
        uint256 id;
        bytes32 hcode;
        bytes mcode;
        uint256 deals;
        uint256 arbitration;
        uint8 unit;
        string name;
        Types.UserOrder order;
    }
}