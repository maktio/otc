import serojs from "serojs";
import seropp from "sero-pp";
import {tokenToBytes} from "./common";
import {JsonRpc} from "./utils/jsonrpc";
import BigNumber from 'bignumber.js'

import {Toast} from "antd-mobile";

const config = {
    name: "OTC",
    contractAddress: "5Yc7VZw2nSoFxkMgKQSqhiD6HNGHsFmxtCFyP3JgsnC8QSBWXY4jMw32PNxVNbPH7LL4jY4GX9gJZWS1EryGt1wn",
    github: "https://github.com/coral-dex/otc",
    author: "otc",
    url: document.location.href,
    logo: document.location.protocol + '//' + document.location.host + '/otc/logo.png'
};

const abiJson = [{"inputs":[{"internalType":"address","name":"_auditor","type":"address"}],"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"previousOwner","type":"address"},{"indexed":true,"internalType":"address","name":"newOwner","type":"address"}],"name":"OwnershipTransferred","type":"event"},{"inputs":[{"internalType":"bytes32","name":"hcode","type":"bytes32"},{"internalType":"uint8","name":"label","type":"uint8"}],"name":"addLable","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"string","name":"token","type":"string"}],"name":"addToken","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes32[]","name":"hcodes","type":"bytes32[]"},{"internalType":"bool","name":"status","type":"bool"}],"name":"audited","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"auditingList","outputs":[{"components":[{"internalType":"bytes32","name":"hcode","type":"bytes32"},{"internalType":"bytes32","name":"pcode","type":"bytes32"}],"internalType":"struct OTC.RetAuditedInfo[]","name":"rets","type":"tuple[]"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"auditor","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"string","name":"tokenName","type":"string"},{"internalType":"uint256","name":"value","type":"uint256"},{"internalType":"uint256","name":"minDealValue","type":"uint256"},{"internalType":"uint256","name":"maxDealVlaue","type":"uint256"},{"internalType":"uint256","name":"price","type":"uint256"},{"internalType":"uint8","name":"unit","type":"uint8"}],"name":"businessBuy","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"orderId","type":"uint256"}],"name":"businessCancel","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"string","name":"tokenName","type":"string"},{"internalType":"uint8","name":"unit","type":"uint8"},{"internalType":"bool","name":"myself","type":"bool"}],"name":"businessOrders","outputs":[{"components":[{"internalType":"uint256","name":"id","type":"uint256"},{"components":[{"internalType":"address","name":"owner","type":"address"},{"internalType":"bytes32","name":"token","type":"bytes32"},{"internalType":"uint256","name":"value","type":"uint256"},{"internalType":"uint256","name":"dealtValue","type":"uint256"},{"internalType":"uint256","name":"lockinValue","type":"uint256"},{"internalType":"uint256","name":"minDealValue","type":"uint256"},{"internalType":"uint256","name":"maxDealValue","type":"uint256"},{"internalType":"uint256","name":"price","type":"uint256"},{"internalType":"uint256","name":"timestemp","type":"uint256"},{"internalType":"uint8","name":"unit","type":"uint8"},{"internalType":"enum Types.OrderType","name":"orderType","type":"uint8"},{"internalType":"enum Types.OrderStatus","name":"status","type":"uint8"}],"internalType":"struct Types.BusinessOrder","name":"order","type":"tuple"},{"internalType":"string","name":"name","type":"string"},{"internalType":"bytes32","name":"hcode","type":"bytes32"},{"internalType":"uint256","name":"deals","type":"uint256"},{"internalType":"uint256","name":"arbitration","type":"uint256"},{"internalType":"uint8[]","name":"labels","type":"uint8[]"}],"internalType":"struct OTC.RetBusinessOrder[]","name":"rets","type":"tuple[]"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"minDealValue","type":"uint256"},{"internalType":"uint256","name":"maxDealVlaue","type":"uint256"},{"internalType":"uint256","name":"price","type":"uint256"},{"internalType":"uint8","name":"unit","type":"uint8"}],"name":"businessSell","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"uint256","name":"userOrderId","type":"uint256"},{"internalType":"bytes32","name":"mcode","type":"bytes32"}],"name":"confirmed","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes32","name":"mcode","type":"bytes32"},{"internalType":"uint256","name":"orderId","type":"uint256"},{"internalType":"uint256","name":"value","type":"uint256"}],"name":"exchangeBuy","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes32","name":"mcode","type":"bytes32"},{"internalType":"uint256","name":"orderId","type":"uint256"}],"name":"exchangeSell","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"uint256","name":"userOrderId","type":"uint256"},{"internalType":"bool","name":"businessWin","type":"bool"}],"name":"executeArbitrate","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"userOrderId","type":"uint256"}],"name":"finished","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes32","name":"hcode","type":"bytes32"}],"name":"invalidAudited","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"myKyc","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"},{"internalType":"bytes32","name":"","type":"bytes32"},{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"bytes32","name":"pcode","type":"bytes32"}],"name":"needAuditing","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"userOrderId","type":"uint256"}],"name":"orderInfo","outputs":[{"components":[{"internalType":"address","name":"owner","type":"address"},{"internalType":"uint256","name":"businessOrderId","type":"uint256"},{"internalType":"uint256","name":"value","type":"uint256"},{"internalType":"uint256","name":"price","type":"uint256"},{"internalType":"bytes32","name":"token","type":"bytes32"},{"internalType":"uint256","name":"createTime","type":"uint256"},{"internalType":"uint256","name":"updateTime","type":"uint256"},{"internalType":"enum Types.OrderStatus","name":"status","type":"uint8"},{"internalType":"enum Types.OrderType","name":"orderType","type":"uint8"}],"internalType":"struct Types.UserOrder","name":"userOrder","type":"tuple"},{"components":[{"internalType":"address","name":"owner","type":"address"},{"internalType":"bytes32","name":"token","type":"bytes32"},{"internalType":"uint256","name":"value","type":"uint256"},{"internalType":"uint256","name":"dealtValue","type":"uint256"},{"internalType":"uint256","name":"lockinValue","type":"uint256"},{"internalType":"uint256","name":"minDealValue","type":"uint256"},{"internalType":"uint256","name":"maxDealValue","type":"uint256"},{"internalType":"uint256","name":"price","type":"uint256"},{"internalType":"uint256","name":"timestemp","type":"uint256"},{"internalType":"uint8","name":"unit","type":"uint8"},{"internalType":"enum Types.OrderType","name":"orderType","type":"uint8"},{"internalType":"enum Types.OrderStatus","name":"status","type":"uint8"}],"internalType":"struct Types.BusinessOrder","name":"businessOrder","type":"tuple"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"owner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"userOrderId","type":"uint256"}],"name":"refused","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"string","name":"name","type":"string"},{"internalType":"bytes32","name":"hcode","type":"bytes32"},{"internalType":"bytes32","name":"ecode","type":"bytes32"},{"internalType":"bytes32","name":"pcode","type":"bytes32"}],"name":"registerKyc","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_auditor","type":"address"}],"name":"setAuditor","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"newOwner","type":"address"}],"name":"transferOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"orderId","type":"uint256"},{"internalType":"uint256","name":"price","type":"uint256"}],"name":"updatePrice","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"userOrderId","type":"uint256"}],"name":"userCancel","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bool","name":"myself","type":"bool"}],"name":"userOrders","outputs":[{"components":[{"internalType":"uint256","name":"id","type":"uint256"},{"components":[{"internalType":"address","name":"owner","type":"address"},{"internalType":"uint256","name":"businessOrderId","type":"uint256"},{"internalType":"uint256","name":"value","type":"uint256"},{"internalType":"uint256","name":"price","type":"uint256"},{"internalType":"bytes32","name":"token","type":"bytes32"},{"internalType":"uint256","name":"createTime","type":"uint256"},{"internalType":"uint256","name":"updateTime","type":"uint256"},{"internalType":"enum Types.OrderStatus","name":"status","type":"uint8"},{"internalType":"enum Types.OrderType","name":"orderType","type":"uint8"}],"internalType":"struct Types.UserOrder","name":"order","type":"tuple"},{"internalType":"bytes32","name":"hcode","type":"bytes32"},{"internalType":"bytes32","name":"ecode","type":"bytes32"},{"internalType":"string","name":"name","type":"string"}],"internalType":"struct OTC.RetUserOrder[]","name":"rets","type":"tuple[]"}],"stateMutability":"view","type":"function"}];

const contract = serojs.callContract(abiJson, "5Yc7VZw2nSoFxkMgKQSqhiD6HNGHsFmxtCFyP3JgsnC8QSBWXY4jMw32PNxVNbPH7LL4jY4GX9gJZWS1EryGt1wn");

const rpc = new JsonRpc();

const unitMap = new Map([["SCNY",0],["SUSD",1]]);

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

    unit(name) {
        return unitMap.get(name);
    }

    tokenList() {
        return ["SCNY","SUSD"];
    }
    initLanguage(callback) {
        seropp.getInfo(function (info) {
            callback(info.language);
        });
    }

    accountDetails(pk, callback) {
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
                        callback(res)
                    }
                })
            }
        });
    }

    getFullAddress(pkrs, callback) {
        console.log(pkrs);
        rpc.seroRpc("http://150.158.109.143:8545", "sero_getFullAddress", [pkrs], function (rets) {
            callback(rets);
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
            console.log("auditingList", ret.rets);
            callback(ret.rets)
        });
    }

    myKyc(from, callback) {
        this.callMethod(contract, 'myKyc', from, [], function (rets) {
            console.log("mykyc", rets);
            callback(rets[0] != "0x0000000000000000000000000000000000000000000000000000000000000000" ? rets[0] : null
                , rets[1] != "0x0000000000000000000000000000000000000000000000000000000000000000" ? rets[1] : null, rets[2]);
        });
    }

    businessOrders(from, tokenName,unit, flag, callback) {
        this.callMethod(contract, 'businessOrders', from, [tokenName, unit, flag], function (ret) {
            callback(ret.rets);
        });
    }

    userOrders(from, flag, callback) {
        this.callMethod(contract, 'userOrders', from, [flag], function (ret) {
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

    registerKyc(pk, mainPKr, name, ecode, hcode, pcode, callback) {
        this.executeMethod(contract, 'registerKyc', pk, mainPKr, [name, ecode, hcode, pcode], "SERO", 0, callback);
    }

    exchangeBuy(pk, mainPKr, ecode, orderId, value, callback) {
        this.executeMethod(contract, 'exchangeBuy', pk, mainPKr, [ecode, this.bigToHex(orderId), this.bigToHex(value)], "SERO", 0, callback);
    }

    exchangeSell(pk, mainPKr, ecode, orderId, tokenName, value, callback) {
        this.executeMethod(contract, 'exchangeSell', pk, mainPKr, [ecode, this.bigToHex(orderId)], tokenName, value, callback);
    }

    bigToHex(big) {
        return "0x" + new BigNumber(big).toString(16)
    }

    businessSell(pk, mainPKr, tokenName, value, minValue, maxValue, price, unit, callback) {
        this.executeMethod(contract, 'businessSell', pk, mainPKr, [this.bigToHex(minValue), this.bigToHex(maxValue), this.bigToHex(price), unit], tokenName, value, callback);
    }

    businessBuy(pk, mainPKr, tokenName, value, minValue, maxValue, price, unit, callback) {
        this.executeMethod(contract, 'businessBuy', pk, mainPKr, [tokenName, this.bigToHex(value), this.bigToHex(minValue), this.bigToHex(maxValue), this.bigToHex(price), unit], "SERO", 0, callback);
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