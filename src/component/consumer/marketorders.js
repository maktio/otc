import React, {Component} from 'react';
import {Button, Modal, Toast, WhiteSpace, Card, Icon, Flex, List, Radio} from "antd-mobile";
import 'semantic-ui-css/semantic.min.css';
import oAbi from '../oabi'
import BigNumber from "bignumber.js";
import {showValue} from "../common";
import language from '../language'
import Kyc from "../Kyc";

const alert = Modal.alert;

export class MarketOrders extends Kyc {
    constructor(props) {
        super(props, {
            sellOrders: [],
            buyOrders: [],
            token: oAbi.tokenList(0)[0],
            unit: 0,
            showSelect: false,
            showPopup: false,
            payTypes: [],
            payType: 0,
            popup: "",
            pkr: "",
            id: "",
            price: 0,
            maxValue: 0
        });
    }

    _componentDidMount(account, code) {
        let self = this;
        self._init(account.mainPKr, this.state.token);

        if (!code) {
            self.startKycTimer(account.pk, account.mainPKr);
        }

        if (!self.timer) {
            self.timer = setInterval(function () {
                self._init();
            }, 10 * 1000);
        }
    }

    _init(mainPKr, token, unit) {
        let self = this;
        if (!mainPKr) {
            mainPKr = this.state.mainPKr;
        }
        if (!token) {
            token = this.state.token;
        }
        if (unit == undefined) {
            unit = this.state.unit;
        }
        if (!token) {
            return;
        }

        oAbi.businessOrderList(mainPKr, token, unit, false, function (orders) {
            if (!orders.length) {
                return;
            }
            let ids = [];
            let sellOrders = [];
            let buyOrders = [];

            if (orders.length > 0) {
                orders = orders.filter(function (item) {
                    return item.order.status == 0 && new BigNumber(item.order.value).comparedTo(new BigNumber(item.order.dealtValue)) > 0;
                });


                orders.forEach(item => {
                    item.pkr = "0x" + item.order.owner.slice(-40);
                    ids.push(item.pkr);
                });

                oAbi.getFullAddress(ids, function (ret) {
                    orders.forEach(item => {
                        item.pkr = ret.result[item.pkr];
                        if (item.order.orderType == 0) {
                            buyOrders.push(item);
                        } else {
                            sellOrders.push(item);
                        }
                    });
                    self.setState({sellOrders: sellOrders, buyOrders: buyOrders});
                });
            } else {
                self.setState({sellOrders: sellOrders, buyOrders: buyOrders});
            }
        });
    }

    createOrder(pkr, orderId, amount, payType) {
        let self = this;
        let orderType = this.props.orderType;
        oAbi.pkrEncrypt(pkr, oAbi.code1(self.state.code), function (mcode) {
            if (orderType == 0) {
                oAbi.exchangeBuy(self.state.pk, self.state.mainPKr, mcode, orderId, amount, payType);
            } else {
                oAbi.exchangeSell(self.state.pk, self.state.mainPKr, mcode, orderId, self.state.token, amount, payType);
            }
        });
    }

    getPayTypes(orderType, item) {
        let self = this;
        if (orderType == 0) {
            oAbi.getPayTypes(item.hcode, oAbi.unitName(self.state.unit), function (list) {
                oAbi.chargeRate(self.state.mainPKr, function (chargeRate) {
                    self.setState({
                        payType: list[0].index,
                        payTypes: list, showPopup: true, id: item.id, pkr: item.pkr,
                        maxValue: item.order.value - item.order.dealtValue,
                        price: item.order.price,
                        chargeRate: chargeRate,
                        amount: 0
                    });
                });
            })

        } else {
            let code2 = oAbi.code2(oAbi.code1(this.state.code));
            oAbi.getPayTypes(code2, oAbi.unitName(self.state.unit), function (list) {
                self.setState({
                    payType: list[0].index,
                    payTypes: list, showPopup: true, id: item.id, pkr: item.pkr,
                    maxValue: item.order.value - item.order.dealtValue,
                    price: item.order.price,
                });
            })
        }
    }

    render() {
        let tabList = oAbi.tokenList(this.state.unit).map((item, index) => {
            return <div className="item" key={index}>
                <span style={this.state.token == item ? {fontWeight: 'bold', color: 'black'} : {}} onClick={() => {
                    this.setState({token: item});
                    this.init(this.state.mainPKr, item);
                }}>{item
                }</span>
            </div>
        });

        let orderType = this.props.orderType;
        let orders;
        if (orderType == 1) {
            orders = this.state.buyOrders;
        } else {
            orders = this.state.sellOrders;
        }
        let self = this;
        let showOrders = orders.map((item, index) => {
            let value = item.order.value - item.order.dealtValue - item.order.lockinValue;
            return (
                <div className="item" key={index}>
                    <Card>
                        <Card.Header
                            title={item.name}
                            extra={
                                <div className="ui breadcrumb">
                                    <div className="section">败诉:{item.arbitration} 成交:{item.deals}</div>
                                    <div className="divider"></div>
                                    <div className="active section">
                                        <a onClick={() => {
                                            let url = "https://ahoj.xyz/levelInfo/code2/" + item.hcode + "?lang=cn";
                                            alert('', <iframe src={url}
                                                                                    width="100%"
                                                                                    height={document.documentElement.clientHeight * 0.7}
                                                                                    display="initial"
                                                                                    position="relative"
                                                                                    frameBorder="no"
                                                />
                                            )
                                        }}>{language.e().order.tips8}</a>
                                    </div>
                                </div>}/>
                        <Card.Body>
                            <Flex>
                                <Flex.Item>
                                    <div style={{
                                        fontSize: "14px",
                                        fontWeight: "800"
                                    }}>{showValue(item.order.price, 9, 4)} {oAbi.unitName(self.state.unit)}
                                    </div>
                                </Flex.Item>

                                <Flex.Item style={{textAlign: 'right'}}>
                                    <a onClick={() => {
                                        let payMethods = []
                                        oAbi.getPayTypes(item.hcode, oAbi.unitName(self.state.unit), function (list) {
                                            list.forEach((item) => {
                                                payMethods.push(<Flex key={item.index} style={{textAlign:'center'}}>
                                                    <Flex.Item style={{flex: 1}}>{item.type}</Flex.Item>
                                                    <Flex.Item style={{flex: 1}}>{item.channel}</Flex.Item>
                                                </Flex>)
                                            });
                                            Modal.alert("", payMethods);
                                        })
                                    }}>
                                        支付方式
                                    </a>
                                </Flex.Item>
                            </Flex>
                            <WhiteSpace/>
                            <Flex>
                                <Flex.Item>
                                    <div>
                                        <div>数量: {showValue(value, 18, 4)}</div>
                                        <div>限额: {showValue(item.order.minDealValue, 18, 0)}-{showValue(item.order.maxDealValue, 18, 4)}</div>
                                    </div>
                                </Flex.Item>
                                <Flex.Item style={{textAlign:'right'}}>
                                    <Button type="ghost" inline size="small" style={{marginRight: '4px'}}
                                            onClick={() => {
                                                if (!this.state.code) {
                                                    this.kyc(false);
                                                } else {
                                                    this.getPayTypes(orderType, item);
                                                }
                                            }}>
                                        {orderType == 1 ? language.e().order.sell : language.e().order.buy}
                                    </Button>
                                </Flex.Item>
                            </Flex>
                        </Card.Body>
                        <Card.Footer content="" extra={item.order.information}/>
                    </Card>
                </div>
            )
        });

        let payTypeItems = this.state.payTypes.map((each, index) => {
            return <Radio.RadioItem key={each.index}
                                    checked={self.state.payType === each.index}
                                    onChange={() => {
                                        self.setState({payType: each.index});
                                    }}>
                {each.type + " " + each.channel + " " + each.account}
            </Radio.RadioItem>
        });

        return (
            <div>
                <Modal
                    popup
                    visible={this.state.showPopup}
                    animationType="slide-up"
                >
                    <List renderHeader={() => <div>委托买入</div>} className="popup-list">
                        <List.Item>
                            <Flex>
                                <Flex.Item
                                    style={{flex: 1}}><span>单价:{showValue(this.state.price, 9, 4)}{oAbi.unitName(this.state.unit)}</span></Flex.Item>
                                {
                                    orderType == 0 ? <Flex.Item style={{flex: 2, textAlign: 'right'}}>
                                        <span>手续费:{this.state.chargeRate / 10000}%, 实收:{this.state.amount}</span>
                                    </Flex.Item> : <Flex.Item style={{flex: 2, textAlign: 'right'}}>
                                        <div className="label" style={{color: '#888'}}>
                                            账号可用余额: {this.state.balances ? showValue(this.state.balances.get(this.state.token), 18, 2) : "0"} {this.state.token}
                                        </div>
                                    </Flex.Item>
                                }
                            </Flex>
                        </List.Item>

                        <List.Item>
                            <div className="ui icon input" style={{width: "100%"}}>
                                <input type="text" placeholder="amount" ref={el => this.amountValue = el}
                                       onChange={(event) => {
                                           let value = event.target.value;
                                           if (value) {
                                               value = (value.match(/^\d*(\.?\d{0,4})/g)[0]) || null
                                           }
                                           this.amountValue.value = value;
                                           this.setState({amount: value * (10000 - this.state.chargeRate) / 10000});
                                       }}/>
                                <i className="icon" style={{top: '12px', color: "#000"}}>{this.state.token}</i>
                            </div>
                        </List.Item>
                        {payTypeItems}
                        <List.Item>
                            <Flex>
                                <Flex.Item style={{flex: 1}}>
                                    <Button type={"primary"} onClick={() => {
                                        self.setState({showPopup: false});
                                    }}>取消
                                    </Button>
                                </Flex.Item>
                                <Flex.Item style={{flex: 3}}>
                                    <Button type={orderType == 0 ? "primary" : "warning"} onClick={() => {
                                        let amount = new BigNumber(this.amountValue.value).multipliedBy(new BigNumber(10).pow(18)).toNumber();
                                        if (amount == 0) {
                                            Toast.fail("输入金额为0");
                                            return;
                                        }

                                        if (amount < this.state.minValue) {
                                            Toast.fail("低于最小交易额!");
                                            return;
                                        }

                                        if (amount > this.state.maxValue) {
                                            Toast.fail("超出可交易范围!");
                                            return;
                                        }
                                        self.createOrder(this.state.pkr, this.state.id, amount, this.state.payType);
                                        self.setState({showPopup: false});
                                    }}>
                                        {orderType == 1 ? language.e().order.sell : language.e().order.buy}
                                    </Button>
                                </Flex.Item>
                            </Flex>
                        </List.Item>
                    </List>
                </Modal>

                <WhiteSpace/>
                <div className="ui breadcrumb">
                    <div className="section">
                        <div className="ui dropdown" ref={el => this.dropdown = el}
                             onClick={() => {
                                 this.setState({showSelect: true});
                                 this.dropdown.className = "ui dropdown active visible";
                                 this.menu.className = "menu transition visible";
                             }}>
                            <div className="text">{oAbi.unitName(this.state.unit)}</div>
                            <i className="dropdown icon"></i>
                            <div className="menu transition hidden" ref={el => this.menu = el}>
                                {/*<div className="item" onClick={(e) => {*/}
                                {/*    this.dropdown.className = "ui dropdown ";*/}
                                {/*    this.menu.className = "menu transition hidden";*/}
                                {/*    this.setState({unit: 0, showSelect: false});*/}
                                {/*    this.init(this.state.mainPKr, null, 0);*/}
                                {/*    e.stopPropagation()*/}
                                {/*}}>CNY*/}
                                {/*</div>*/}
                                <div className="item" onClick={(e) => {
                                    this.dropdown.className = "ui dropdown ";
                                    this.menu.className = "menu transition hidden";
                                    this.setState({unit: 0, showSelect: false});
                                    this.init(this.state.mainPKr, null, 0);
                                    e.stopPropagation();
                                }}>USDT
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="divider">&nbsp;&nbsp;&nbsp;&nbsp;</div>
                    <div className="section">
                        <div className="ui small horizontal divided list">
                            {tabList}
                        </div>
                    </div>
                </div>

                <h4 className="ui dividing header">
                    市场挂单
                </h4>
                {orders.length > 0 ?
                    <div className="ui list">{showOrders}</div> :
                    <div style={{textAlign: 'center'}}>
                        <Icon type="iconnodata-topic" style={{width: "100px", height: "100px"}}/>
                    </div>
                }
            </div>
        )
    }
}