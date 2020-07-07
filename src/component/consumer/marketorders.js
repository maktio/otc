import React, {Component} from 'react';
import {Button, Modal, Toast, WhiteSpace, Card, Icon} from "antd-mobile";
import 'semantic-ui-css/semantic.min.css';
import oAbi from '../oabi'
import BigNumber from "bignumber.js";
import {randomByte32, showValue} from "../common";
import BasePage from "../basepage";
import language from '../language'
import Iframe from "react-iframe";

const alert = Modal.alert;

const values = [100, 200, 500, 1000, 5000, 10000, 30000];

export class MarketOrders extends BasePage {
    constructor(props) {
        super(props, {
            sellOrders: [],
            buyOrders: [],
            token: oAbi.tokenList()[0],
            unit: 0,
            showSelect: false
        });
    }

    _componentDidMount(mainPKr) {
        let self = this;
        self.init(mainPKr, this.state.token);

        self.timer = setInterval(function () {
            self.init();
        }, 20 * 1000);
    }

    init(mainPKr, token, unit) {
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

        oAbi.businessOrders(mainPKr, token, unit, false, function (orders) {
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

    render() {
        let orderType = this.props.orderType;
        let tabList = oAbi.tokenList().map((item, index) => {
            return <div className="item" key={index}>
                <a style={this.state.token == item ? {fontWeight: 'bold', color: 'black'} : {}} onClick={() => {
                    this.setState({token: item});
                    this.init(this.state.mainPKr, item);
                }}>{item
                }</a>
            </div>
        });


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
                            extra={<span onClick={() => {
                                let url = "https://ahoj.xyz/level/code2/" + item.hcode + "?lang=cn";
                                alert('联系方式', <Iframe url={url}
                                                      width="100%"
                                                      height="450px"
                                                      display="initial"
                                                      position="relative"/>
                                )
                            }}>联系商家</span>}
                        />
                        <Card.Body>
                            <div style={{fontSize: "14px", fontWeight: "800"}}>{showValue(item.order.price, 9, 4)} {oAbi.unitName(self.state.unit)}
                            </div>
                        </Card.Body>
                        <Card.Footer content={
                            <div>
                                <div>数量: {showValue(value, 18, 4)}</div>
                                <div>限额: {showValue(item.order.minDealValue, 18, 0)}-{showValue(item.order.maxDealValue, 18, 4)}</div>
                            </div>
                        } extra={
                            <Button type="ghost" inline size="small" style={{marginRight: '4px'}}
                                    onClick={() => {
                                        if (this.state.auditedStatus == 0) {
                                            this.kyc(false);
                                        } else {
                                            let options = values.map((value, index) => {
                                                if (new BigNumber(value).multipliedBy(new BigNumber(10).pow(18)).comparedTo(new BigNumber(item.order.value - item.order.dealtValue)) <= 0) {
                                                    return (
                                                        <option key={index} value={value}>{value}</option>
                                                    )
                                                }
                                            });
                                            Modal.alert(
                                                <span>{orderType == 1 ? language.e().order.sell : language.e().order.buy}</span>,
                                                <div>
                                                    <select className="ui selection dropdown"
                                                            ref={el => this.amountValue = el}
                                                            onChange={(e) => {
                                                                this.amountValue.value = e.target.value;
                                                            }}>
                                                        {options}
                                                    </select>
                                                </div>
                                                , [
                                                    {text: 'Cancel'},
                                                    {
                                                        text: 'Ok', onPress: () => {
                                                            let amount = new BigNumber(this.amountValue.value).multipliedBy(new BigNumber(10).pow(18)).toNumber();
                                                            if (amount == 0) {
                                                                Toast.fail("输入金额为0");
                                                                return;
                                                            }
                                                            if (amount > (item.order.value - item.order.dealtValue)) {
                                                                Toast.fail("超出可交易范围!");
                                                                return;
                                                            }

                                                            oAbi.pkrEncrypt(item.pkr, oAbi.code1(self.state.code), function (mcode) {
                                                                if (orderType == 0) {
                                                                    oAbi.exchangeBuy(self.state.pk, self.state.mainPKr, mcode, item.id, amount);
                                                                } else {
                                                                    oAbi.exchangeSell(self.state.pk, self.state.mainPKr, mcode, item.id, self.state.token, amount);
                                                                }
                                                            });
                                                        }
                                                    },
                                                ])
                                        }

                                    }}>
                                {orderType == 1 ? language.e().order.sell : language.e().order.buy}
                            </Button>
                        }/>
                    </Card>
                </div>
            )
        });

        return (
            <div>
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
                                <div className="item" onClick={(e) => {
                                    this.dropdown.className = "ui dropdown ";
                                    this.menu.className = "menu transition hidden";
                                    this.setState({unit: 0, showSelect: false});
                                    this.init(this.state.mainPKr, null, 0);
                                    e.stopPropagation()
                                }}>CNY
                                </div>
                                <div className="item" onClick={(e) => {
                                    this.dropdown.className = "ui dropdown ";
                                    this.menu.className = "menu transition hidden";
                                    this.setState({unit: 1, showSelect: false});
                                    this.init(this.state.mainPKr, null, 1);
                                    e.stopPropagation();
                                }}>USD
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