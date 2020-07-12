import serojs from "serojs";
import seropp from "sero-pp";
import {tokenToBytes} from "./common";
import {JsonRpc} from "./utils/jsonrpc";
import BigNumber from 'bignumber.js'

import {Radio, Toast} from "antd-mobile";
import React from "react";

const B2B = require("blake2b")

const config = {
    name: "MAKT",
    contractAddress: "ZubiZPeJYmfXqLruYcgDgmuzbGx7QUz1DbDuQyeihi2vHD7PBFGWhvb8PdxupjX81N3CYLdQ4Dnk226qisVVPt7",
    github: "https://github.com/maktio/otc",
    author: "maktio",
    url: document.location.href,
    logo: document.location.protocol + '//' + document.location.host + '/logo.png'
};

const abiJson = [{"inputs":[{"internalType":"address","name":"_auditor","type":"address"}],"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"bytes32","name":"token","type":"bytes32"},{"indexed":false,"internalType":"uint256","name":"value","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"price","type":"uint256"},{"indexed":false,"internalType":"uint8","name":"unit","type":"uint8"},{"indexed":false,"internalType":"uint8","name":"orderType","type":"uint8"}],"name":"OrderLog","type":"event"},{"inputs":[{"internalType":"bytes32","name":"hcode","type":"bytes32"},{"internalType":"uint8","name":"label","type":"uint8"}],"name":"addLabel","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_manager","type":"address"}],"name":"addManager","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"userOrderId","type":"uint256"}],"name":"arbitrate","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"arbitrateOrders","outputs":[{"components":[{"internalType":"uint256","name":"id","type":"uint256"},{"internalType":"bytes32","name":"hcode","type":"bytes32"},{"internalType":"bytes","name":"mcode","type":"bytes"},{"internalType":"uint256","name":"deals","type":"uint256"},{"internalType":"uint256","name":"arbitration","type":"uint256"},{"internalType":"uint8","name":"unit","type":"uint8"},{"internalType":"string","name":"name","type":"string"},{"components":[{"internalType":"address","name":"owner","type":"address"},{"internalType":"uint256","name":"businessOrderId","type":"uint256"},{"internalType":"uint256","name":"value","type":"uint256"},{"internalType":"uint256","name":"price","type":"uint256"},{"internalType":"bytes32","name":"token","type":"bytes32"},{"internalType":"uint256","name":"createTime","type":"uint256"},{"internalType":"uint256","name":"updateTime","type":"uint256"},{"internalType":"uint16","name":"payType","type":"uint16"},{"internalType":"enum Types.OrderStatus","name":"status","type":"uint8"},{"internalType":"enum Types.OrderType","name":"orderType","type":"uint8"}],"internalType":"struct Types.UserOrder","name":"order","type":"tuple"}],"internalType":"struct Types.RetUserOrder[]","name":"rets","type":"tuple[]"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"bytes32[]","name":"hcodes","type":"bytes32[]"},{"internalType":"bool","name":"status","type":"bool"}],"name":"audited","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"auditingList","outputs":[{"components":[{"internalType":"bytes32","name":"hcode","type":"bytes32"},{"internalType":"bytes","name":"pcode","type":"bytes"}],"internalType":"struct OTC.RetAuditedInfo[]","name":"rets","type":"tuple[]"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"auditor","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"string","name":"tokenName","type":"string"},{"internalType":"uint256","name":"value","type":"uint256"},{"internalType":"uint256","name":"minDealValue","type":"uint256"},{"internalType":"uint256","name":"maxDealVlaue","type":"uint256"},{"internalType":"uint256","name":"price","type":"uint256"},{"internalType":"uint8","name":"unit","type":"uint8"},{"internalType":"string","name":"information","type":"string"}],"name":"businessBuy","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"orderId","type":"uint256"}],"name":"businessCancel","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"string","name":"tokenName","type":"string"},{"internalType":"uint8","name":"unit","type":"uint8"},{"internalType":"bool","name":"myself","type":"bool"}],"name":"businessOrderList","outputs":[{"components":[{"internalType":"uint256","name":"id","type":"uint256"},{"components":[{"internalType":"address","name":"owner","type":"address"},{"internalType":"bytes32","name":"token","type":"bytes32"},{"internalType":"uint256","name":"value","type":"uint256"},{"internalType":"uint256","name":"dealtValue","type":"uint256"},{"internalType":"uint256","name":"lockinValue","type":"uint256"},{"internalType":"uint256","name":"minDealValue","type":"uint256"},{"internalType":"uint256","name":"maxDealValue","type":"uint256"},{"internalType":"uint256","name":"price","type":"uint256"},{"internalType":"uint256","name":"createTime","type":"uint256"},{"internalType":"uint8","name":"unit","type":"uint8"},{"internalType":"enum Types.OrderType","name":"orderType","type":"uint8"},{"internalType":"enum Types.OrderStatus","name":"status","type":"uint8"},{"internalType":"string","name":"information","type":"string"}],"internalType":"struct Types.BusinessOrder","name":"order","type":"tuple"},{"internalType":"string","name":"name","type":"string"},{"internalType":"bytes32","name":"hcode","type":"bytes32"},{"internalType":"uint256","name":"underwayCount","type":"uint256"},{"internalType":"uint256","name":"deals","type":"uint256"},{"internalType":"uint256","name":"arbitration","type":"uint256"},{"internalType":"uint8[]","name":"labels","type":"uint8[]"}],"internalType":"struct Types.RetBusinessOrder[]","name":"rets","type":"tuple[]"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"minDealValue","type":"uint256"},{"internalType":"uint256","name":"maxDealVlaue","type":"uint256"},{"internalType":"uint256","name":"price","type":"uint256"},{"internalType":"uint8","name":"unit","type":"uint8"},{"internalType":"string","name":"information","type":"string"}],"name":"businessSell","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"uint256","name":"userOrderId","type":"uint256"},{"internalType":"bytes","name":"mcode","type":"bytes"}],"name":"confirmed","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes","name":"mcode","type":"bytes"},{"internalType":"uint256","name":"orderId","type":"uint256"},{"internalType":"uint256","name":"value","type":"uint256"},{"internalType":"uint8","name":"payType","type":"uint8"}],"name":"exchangeBuy","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes","name":"mcode","type":"bytes"},{"internalType":"uint256","name":"orderId","type":"uint256"},{"internalType":"uint8","name":"payType","type":"uint8"}],"name":"exchangeSell","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"uint256","name":"userOrderId","type":"uint256"},{"internalType":"uint8","name":"winRole","type":"uint8"}],"name":"executeArbitrate","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"userOrderId","type":"uint256"}],"name":"finished","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"","type":"address"}],"name":"managers","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"myKyc","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"},{"internalType":"uint8","name":"","type":"uint8"},{"components":[{"internalType":"string","name":"name","type":"string"},{"internalType":"uint64","name":"userDeals","type":"uint64"},{"internalType":"uint64","name":"businessDeals","type":"uint64"},{"internalType":"uint64","name":"userRoleArbitrates","type":"uint64"},{"internalType":"uint64","name":"businessRoleArbitrates","type":"uint64"},{"internalType":"uint8[]","name":"labels","type":"uint8[]"}],"internalType":"struct OTC.Kyc","name":"","type":"tuple"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"bytes","name":"pcode","type":"bytes"}],"name":"needAuditing","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"id","type":"uint256"}],"name":"orderInfo","outputs":[{"components":[{"internalType":"uint256","name":"id","type":"uint256"},{"internalType":"bytes32","name":"hcode","type":"bytes32"},{"internalType":"bytes","name":"mcode","type":"bytes"},{"internalType":"uint256","name":"deals","type":"uint256"},{"internalType":"uint256","name":"arbitration","type":"uint256"},{"internalType":"uint8","name":"unit","type":"uint8"},{"internalType":"string","name":"name","type":"string"},{"components":[{"internalType":"address","name":"owner","type":"address"},{"internalType":"uint256","name":"businessOrderId","type":"uint256"},{"internalType":"uint256","name":"value","type":"uint256"},{"internalType":"uint256","name":"price","type":"uint256"},{"internalType":"bytes32","name":"token","type":"bytes32"},{"internalType":"uint256","name":"createTime","type":"uint256"},{"internalType":"uint256","name":"updateTime","type":"uint256"},{"internalType":"uint16","name":"payType","type":"uint16"},{"internalType":"enum Types.OrderStatus","name":"status","type":"uint8"},{"internalType":"enum Types.OrderType","name":"orderType","type":"uint8"}],"internalType":"struct Types.UserOrder","name":"order","type":"tuple"}],"internalType":"struct Types.RetUserOrder","name":"ret","type":"tuple"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"owner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"userOrderId","type":"uint256"}],"name":"refused","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"string","name":"name","type":"string"},{"internalType":"bytes32","name":"hcode","type":"bytes32"},{"internalType":"bytes32","name":"ecode","type":"bytes32"},{"internalType":"bytes","name":"pcode","type":"bytes"}],"name":"registerKyc","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_auditor","type":"address"}],"name":"setAuditor","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"string","name":"token","type":"string"},{"internalType":"uint8","name":"unit","type":"uint8"},{"internalType":"bool","name":"flag","type":"bool"}],"name":"setToken","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"newOwner","type":"address"}],"name":"transferOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"orderId","type":"uint256"},{"internalType":"uint256","name":"price","type":"uint256"}],"name":"updatePrice","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"userOrderId","type":"uint256"}],"name":"userCancel","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"userOrderList","outputs":[{"components":[{"internalType":"uint256","name":"id","type":"uint256"},{"internalType":"bytes32","name":"hcode","type":"bytes32"},{"internalType":"bytes","name":"mcode","type":"bytes"},{"internalType":"uint256","name":"deals","type":"uint256"},{"internalType":"uint256","name":"arbitration","type":"uint256"},{"internalType":"uint8","name":"unit","type":"uint8"},{"internalType":"string","name":"name","type":"string"},{"components":[{"internalType":"address","name":"owner","type":"address"},{"internalType":"uint256","name":"businessOrderId","type":"uint256"},{"internalType":"uint256","name":"value","type":"uint256"},{"internalType":"uint256","name":"price","type":"uint256"},{"internalType":"bytes32","name":"token","type":"bytes32"},{"internalType":"uint256","name":"createTime","type":"uint256"},{"internalType":"uint256","name":"updateTime","type":"uint256"},{"internalType":"uint16","name":"payType","type":"uint16"},{"internalType":"enum Types.OrderStatus","name":"status","type":"uint8"},{"internalType":"enum Types.OrderType","name":"orderType","type":"uint8"}],"internalType":"struct Types.UserOrder","name":"order","type":"tuple"}],"internalType":"struct Types.RetUserOrder[]","name":"rets","type":"tuple[]"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"bid","type":"uint256"}],"name":"userOrderListByBId","outputs":[{"components":[{"internalType":"uint256","name":"id","type":"uint256"},{"internalType":"bytes32","name":"hcode","type":"bytes32"},{"internalType":"bytes","name":"mcode","type":"bytes"},{"internalType":"uint256","name":"deals","type":"uint256"},{"internalType":"uint256","name":"arbitration","type":"uint256"},{"internalType":"uint8","name":"unit","type":"uint8"},{"internalType":"string","name":"name","type":"string"},{"components":[{"internalType":"address","name":"owner","type":"address"},{"internalType":"uint256","name":"businessOrderId","type":"uint256"},{"internalType":"uint256","name":"value","type":"uint256"},{"internalType":"uint256","name":"price","type":"uint256"},{"internalType":"bytes32","name":"token","type":"bytes32"},{"internalType":"uint256","name":"createTime","type":"uint256"},{"internalType":"uint256","name":"updateTime","type":"uint256"},{"internalType":"uint16","name":"payType","type":"uint16"},{"internalType":"enum Types.OrderStatus","name":"status","type":"uint8"},{"internalType":"enum Types.OrderType","name":"orderType","type":"uint8"}],"internalType":"struct Types.UserOrder","name":"order","type":"tuple"}],"internalType":"struct Types.RetUserOrder[]","name":"rets","type":"tuple[]"}],"stateMutability":"view","type":"function"}];

const contract = serojs.callContract(abiJson, "ZubiZPeJYmfXqLruYcgDgmuzbGx7QUz1DbDuQyeihi2vHD7PBFGWhvb8PdxupjX81N3CYLdQ4Dnk226qisVVPt7");

const rpc = new JsonRpc();

const unitMap = new Map([[0, "USDT"]]);
const unitTokens = new Map([[0, ["SUSD"]]]);

class OAbi {

    constructor() {
        let self = this;
        self.init = new Promise(
            (resolve, reject) => {
                seropp.init(config, function (rest) {
                    if (rest === 'success') {
                        return resolve()
                    } else {
                        return reject(rest)
                    }
                })
            }
        )
    }

    unitName(unit) {
        if (unitMap.has(Number(unit))) {
            return unitMap.get(Number(unit));
        }
        return "ALL";

    }

    tokenList(unit) {
        if (unitTokens.has(unit)) {
            return unitTokens.get(unit)
        }
        return [];
    }

    initLanguage(callback) {
        seropp.getInfo(function (info) {
            callback(info.language);
        });
    }

    code1(code0) {
        return this.Blake2B("AHOJ.CODE1", code0);
    }

    code2(code1) {
        return this.Blake2B("AHOJ.CODE2", code1);
    }

    Blake2B(personal, input) {
        if (input.slice(0, 2) === '0x') {
            input = input.slice(2);
        }
        const data = Buffer.from(input, "hex")
        const p = Buffer.alloc(16, 0);
        p.fill(personal, 0, personal.length)
        const hash = B2B(32, null, null, p)
        const out = hash.update(data)
        const buf = out.digest("binary")

        for (var hex = [], i = 0; i < buf.length; i++) {
            /* jshint ignore:start */
            hex.push((buf[i] >>> 4).toString(16));
            hex.push((buf[i] & 0xf).toString(16));
            /* jshint ignore:end */
        }
        return "0x" + hex.join("");
    }

    pkrCrypto(pk, pkr, data, callback) {
        seropp.pkrCrypto({pk: pk, pkr: pkr, data: data}, callback)
    }

    pkrEncrypt(pkr, data, callback) {
        seropp.pkrEncrypt({pkr: pkr, data: data}, callback)
    }

    pkrDecrypt(pk, data, callback) {
        seropp.pkrDecrypt({pk: pk, data: data}, callback)
    }

    getPayTypes(code2, callback) {
        let param = {name: "profile.getByCode2", data: {code2: code2}};
        rpc.post("https://api.ahoj.xyz/api", JSON.stringify(param), 3000, function (ret, err) {
            if (err) {
                callback([{type: "ALL", channel: "ALL", account: "ALL", index: 999}]);
            } else if (ret.state == "succ") {
                let list = [];
                ret.data.pcMethods.forEach((item, index) => {
                    if (!item.disabled) {
                        list.push({type: item.type, channel: item.channel, account: item.account, index: index});
                    }
                });
                callback(list);
            }
        });
    }

    accountDetails(pk, callback) {
        if (!pk) {
            return;
        }
        let self = this;
        seropp.getAccountDetail(pk, function (item) {
            callback({pk: item.PK, mainPKr: item.MainPKr, name: item.Name, balances: item.Balance})
        });
    }

    accountList(callback) {
        seropp.getAccountList(function (data) {
            let accounts = [];
            data.forEach(function (item, index) {
                accounts.push({
                    pk: item.PK,
                    mainPKr: item.MainPKr,
                    name: item.Name,
                    balances: item.Balance,
                })
            });
            callback(accounts)
        });
    }

    callMethod(contract, _method, from, _args, callback) {
        let that = this;
        let packData = contract.packData(_method, _args, true);
        let callParams = {
            from: from,
            to: contract.address,
            data: packData
        };

        seropp.call(callParams, function (callData) {
            if (callData !== "0x") {
                let res = contract.unPackDataEx(_method, callData);
                if (callback) {
                    callback(res);
                }
            } else {
                callback("0x0");
            }
        });
    }

    executeMethod(contract, _method, pk, mainPKr, args, tokenName, value, callback) {
        let that = this;

        let packData = "0x";
        if ("" !== _method) {
            packData = contract.packData(_method, args, true);
        }

        let executeData = {
            from: pk,
            to: contract.address,
            value: "0x" + value.toString(16),
            data: packData,
            gasPrice: "0x" + new BigNumber("1000000000").toString(16),
            cy: tokenName,
        };
        let estimateParam = {
            from: mainPKr,
            to: contract.address,
            value: "0x" + value.toString(16),
            data: packData,
            gasPrice: "0x" + new BigNumber("1000000000").toString(16),
            cy: tokenName,
        };

        seropp.estimateGas(estimateParam, function (gas, error) {
            if (error) {
                Toast.fail("Failed to execute smart contract")
            } else {
                executeData["gas"] = gas;
                seropp.executeContract(executeData, function (res, error) {
                    if (callback) {
                        callback(res, error)
                    }
                })
            }
        });
    }

    getFullAddress(pkrs, callback) {
        seropp.getInfo(function (info) {
            rpc.seroRpc(info.rpc, "sero_getFullAddress", [pkrs], function (rets) {
                callback(rets);
            });
        });
    }

    owner(from, callback) {
        let self = this;
        this.callMethod(contract, 'owner', from, [], function (ret) {
            self.getFullAddress([ret[0]], function (rets) {
                callback(rets.result[ret[0]])
            });
        });
    }

    managers(from, callback) {
        let self = this;
        this.callMethod(contract, 'managers', from, [from], function (ret) {
            callback(ret[0])
        });
    }

    auditor(from, callback) {
        let self = this;
        this.callMethod(contract, 'auditor', from, [], function (ret) {
            self.getFullAddress([ret[0]], function (rets) {
                callback(rets.result[ret[0]])
            });
        });
    }

    auditingList(from, callback) {
        this.callMethod(contract, 'auditingList', from, [], function (ret) {
            callback(ret.rets)
        });
    }

    myKyc(pk, from, callback) {
        let self = this;
        this.callMethod(contract, 'myKyc', from, [], function (rets) {
            if (rets[0] != "0x0000000000000000000000000000000000000000000000000000000000000000") {
                self.pkrCrypto(pk, from, rets[0], function (code) {
                    callback(code, rets[1]);
                })
            } else {
                callback(null, 0);
            }
            callback(rets[0] != "0x0000000000000000000000000000000000000000000000000000000000000000" ? rets[0] : null, rets[1]);
        });
    }

    orderInfo(from, id, callback) {
        this.callMethod(contract, 'orderInfo', from, [this.bigToHex(id)], function (ret) {
            console.log("orderInfo", ret[0]);
            callback(ret[0]);
        });
    }

    arbitrateOrders(from, callback) {
        this.callMethod(contract, 'arbitrateOrders', from, [], function (ret) {
            callback(ret.rets);
        });
    }

    businessOrderList(from, tokenName, unit, flag, callback) {
        this.callMethod(contract, 'businessOrderList', from, [tokenName, unit, flag], function (ret) {
            callback(ret.rets);
        });
    }

    userOrderListByBId(from, id, callback) {
        this.callMethod(contract, 'userOrderListByBId', from, [this.bigToHex(id)], function (ret) {
            console.log("userOrderListByBId", id, ret);
            callback(ret.rets);
        });
    }

    userOrderList(from, callback) {
        this.callMethod(contract, 'userOrderList', from, [], function (ret) {
            callback(ret.rets);
        });
    }

    needAuditing(pk, mainPKr, pcode, callback) {
        this.executeMethod(contract, 'needAuditing', pk, mainPKr, [pcode], "SERO", 0, callback);
    }

    audited(pk, mainPKr, hcodes, flag, callback) {
        this.executeMethod(contract, 'audited', pk, mainPKr, [hcodes, flag], "SERO", 0, callback);
    }

    invalidAudited(pk, mainPKr, hcode, callback) {
        this.executeMethod(contract, 'invalidAudited', pk, mainPKr, [hcode], "SERO", 0, callback);
    }

    addLable(pk, mainPKr, hcode, lable, callback) {
        this.executeMethod(contract, 'addLable', pk, mainPKr, [hcode, lable], "SERO", 0, callback);
    }

    arbitrate(pk, mainPKr, orderId, callback) {
        this.executeMethod(contract, 'arbitrate', pk, mainPKr, [this.bigToHex(orderId)], "SERO", 0, callback);
    }

    executeArbitrate(pk, mainPKr, orderId, winRole, callback) {
        this.executeMethod(contract, 'executeArbitrate', pk, mainPKr, [this.bigToHex(orderId), winRole], "SERO", 0, callback);
    }

    registerKyc(pk, mainPKr, name, hcode, ecode, pcode, callback) {
        this.executeMethod(contract, 'registerKyc', pk, mainPKr, [name, hcode, ecode, pcode], "SERO", 0, callback);
    }

    exchangeBuy(pk, mainPKr, mcode, orderId, value, payType, callback) {
        this.executeMethod(contract, 'exchangeBuy', pk, mainPKr, [mcode, this.bigToHex(orderId), this.bigToHex(value), payType], "SERO", 0, callback);
    }

    exchangeSell(pk, mainPKr, mcode, orderId, tokenName, value, payType, callback) {
        this.executeMethod(contract, 'exchangeSell', pk, mainPKr, [mcode, this.bigToHex(orderId), payType], tokenName, value, callback);
    }

    bigToHex(big) {
        return "0x" + new BigNumber(big).toString(16)
    }

    businessSell(pk, mainPKr, tokenName, value, minValue, maxValue, price, unit, callback) {
        this.executeMethod(contract, 'businessSell', pk, mainPKr, [this.bigToHex(minValue), this.bigToHex(maxValue), this.bigToHex(price), unit, ""], tokenName, value, callback);
    }

    businessBuy(pk, mainPKr, tokenName, value, minValue, maxValue, price, unit, callback) {
        this.executeMethod(contract, 'businessBuy', pk, mainPKr, [tokenName, this.bigToHex(value), this.bigToHex(minValue), this.bigToHex(maxValue), this.bigToHex(price), unit, ""], "SERO", 0, callback);
    }

    refused(pk, mainPKr, orderId, callback) {
        this.executeMethod(contract, 'refused', pk, mainPKr, [this.bigToHex(orderId)], "SERO", 0, callback);
    }

    confirmed(pk, mainPKr, orderId, mcode, callback) {
        this.executeMethod(contract, 'confirmed', pk, mainPKr, [this.bigToHex(orderId), mcode], "SERO", 0, callback);
    }

    finished(pk, mainPKr, orderId, callback) {
        this.executeMethod(contract, 'finished', pk, mainPKr, [this.bigToHex(orderId)], "SERO", 0, callback);
    }

    userCancel(pk, mainPKr, orderId, callback) {
        this.executeMethod(contract, 'userCancel', pk, mainPKr, [this.bigToHex(orderId)], "SERO", 0, callback);
    }

    businessCancel(pk, mainPKr, orderId, callback) {
        this.executeMethod(contract, 'businessCancel', pk, mainPKr, [this.bigToHex(orderId)], "SERO", 0, callback);
    }
}

const oAbi = new OAbi();
export default oAbi;