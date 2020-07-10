import React, {Component} from 'react';
import {Button, Flex, List, Modal, Toast, WhiteSpace} from "antd-mobile";
import 'semantic-ui-css/semantic.min.css';
import oAbi from '../oabi'
import {showValue} from "../common";
import BigNumber from "bignumber.js";
import BasePage from "../basepage";

export class PlaceOrder extends BasePage {
    constructor(props) {
        super(props, {
            sellOrders: [],
            buyOrders: [],
            token: oAbi.tokenList(0)[0],
            unit: 0
        });
    }

    _componentDidMount(mainPKr) {
        let self = this;
        self.init(mainPKr, this.state.token);
        if(!self.timer) {
            self.timer = setInterval(function () {
                self.init();
            }, 20 * 1000);
        }
    }

    _componentWillReceiveProps(nextProps) {
        let self = this;
        if (nextProps.orderType != this.props.orderType) {
            this.setState({orderType: nextProps.orderType});
        }
    }

    init(mainPKr, token, unit) {
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

        let self = this;
        oAbi.init
            .then(() => {
                oAbi.businessOrderList(mainPKr, token, unit, false, function (orders) {
                    let sellOrders = [];
                    let buyOrders = [];

                    orders = orders.filter(function (item) {
                        return item.order.status == 0 && new BigNumber(item.order.value).comparedTo(new BigNumber(item.order.dealtValue)) > 0;
                    });

                    orders.forEach(item => {
                        if (item.order.orderType == 0) {
                            buyOrders.push(item);
                        } else {
                            sellOrders.push(item);
                        }
                    });
                    self.setState({sellOrders: sellOrders, buyOrders: buyOrders});
                });
            })
    }

    render() {
        let orderType = this.props.orderType;
        let showOrders;
        let price;
        if (orderType == 0) {
            price = 1;
            showOrders = this.state.buyOrders;
        } else {
            price = 1.005
            showOrders = this.state.sellOrders;
        }

        let orders = showOrders.map((item, index) => {
            return <List.Item key={index}>
                <Flex style={{fontSize:"12px",fontWeight:"800"}}>
                    <Flex.Item>{showValue(item.order.price, 9, 4)}</Flex.Item>
                    <Flex.Item>{showValue(item.order.value - item.order.dealtValue - item.order.lockinValue, 18, 4)}</Flex.Item>
                    <Flex.Item>{showValue(item.order.minDealValue, 18, 4)}-{showValue(item.order.maxDealValue, 18, 4)}</Flex.Item>
                </Flex>
            </List.Item>
        });
        let tabList = oAbi.tokenList(this.state.unit).map((item, index) => {
            return <div className="item" key={index}>
                <a style={this.state.token == item ? {fontWeight: 'bold', color: 'black'} : {}} onClick={() => {
                    this.setState({token: item});
                    this.init(this.state.mainPKr, item);
                }}>{item}</a>
            </div>
        });
        return (
            <div className="ui segment">
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

                <WhiteSpace/>
                <div className="ui icon input" style={{width: "100%"}}>
                    <input disabled={true} type="text" placeholder="Price" ref={el => this.priceValue = el}
                           value={price}
                           onChange={(event) => {
                               let value = event.target.value;
                               if (value) {
                                   value = (value.match(/^\d*(\.?\d{0,4})/g)[0]) || null
                               }
                               // this.priceValue.value = value;
                           }}/>
                    <i className="icon" style={{top: '12px',color:"#000"}}>{oAbi.unitName(this.state.unit)}</i>
                </div>
                <WhiteSpace/>
                <div className="ui icon input" style={{width: "100%"}}>
                    <input type="text" placeholder="Amount" ref={el => this.countValue = el}
                           onChange={(event) => {
                               let value = event.target.value;
                               if (value) {
                                   value = (value.match(/^\d*(\.?\d{0,4})/g)[0]) || null
                               }
                               this.countValue.value = value;
                               this.minValue.value = 0;
                               this.maxValue.value = value;
                           }}/>
                    <i className="icon" style={{top: '12px',color:"#000"}}>{this.state.token}</i>
                </div>
                <WhiteSpace/>
                <Flex style={{textAlign: "center"}}>
                    <Flex.Item>
                        <div className="ui icon input" style={{width: "100%"}}>
                            <input disabled={true} type="text" placeholder="MIN" style={{paddingRight: "10px"}}
                                   ref={el => this.minValue = el} onChange={(event) => {
                                let value = event.target.value;
                                if (value) {
                                    value = (value.match(/^\d*(\.?\d{0,4})/g)[0]) || null
                                }
                                this.minValue.value = value;
                            }}/>
                            <i className="icon" style={{top: '12px',color:"#000"}}>{this.state.token}</i>
                        </div>
                    </Flex.Item>
                    <Flex.Item>
                        <div className="ui icon input" style={{width: "100%"}}>
                            <input disabled={true} type="text" placeholder="MAX" style={{paddingLeft: "10px"}}
                                   ref={el => this.maxValue = el} onChange={(event) => {
                                let value = event.target.value;
                                if (value) {
                                    value = (value.match(/^\d*(\.?\d{0,4})/g)[0]) || null
                                }
                                this.maxValue.value = value;
                            }}/>
                            <i className="icon" style={{top: '12px',color:"#000"}}>{this.state.token}</i>
                        </div>
                    </Flex.Item>

                </Flex>
                <WhiteSpace/>
                <Flex>
                    <Flex.Item>
                        <Button type={orderType == 0?"primary":"warning"} onClick={() => {
                            if (this.state.auditedStatus != 2) {
                                this.kyc(true);
                            } else {
                                if (!this.countValue.value) {
                                    Toast.fail("请填写金额！")
                                    return;
                                }

                                if (!this.priceValue.value) {
                                    Toast.fail("请填写价格！")
                                    return;
                                }

                                let value = new BigNumber(this.countValue.value).multipliedBy(new BigNumber(10).pow(18));
                                let min = new BigNumber(this.minValue.value).multipliedBy(new BigNumber(10).pow(18));
                                let max = new BigNumber(this.maxValue.value).multipliedBy(new BigNumber(10).pow(18));
                                let price = new BigNumber(this.priceValue.value).multipliedBy(1000000000);

                                if (price.isZero()) {
                                    Toast.fail("price is zero")
                                    return;
                                }

                                if (value.isZero()) {
                                    Toast.fail("value is zero")
                                    return;
                                }

                                if (max.isZero()) {
                                    Toast.fail("max is zero")
                                    return;
                                }

                                if (min.comparedTo(max) > 0) {
                                    Toast.fail("min must <= max")
                                    return;
                                }

                                if (max.comparedTo(value) > 0) {
                                    Toast.fail("max must <= amount")
                                    return;
                                }

                                if (orderType === 1) {
                                    oAbi.businessSell(this.state.pk, this.state.mainPKr, this.state.token, value, min, max, price, this.state.unit);
                                } else {
                                    oAbi.businessBuy(this.state.pk, this.state.mainPKr, this.state.token, value, min, max, price, this.state.unit);
                                }
                            }
                        }}>{orderType == 0 ? "立即买入" : "立即卖出"}</Button>
                    </Flex.Item>
                </Flex>
                {showOrders.length > 0 && <List renderHeader={() => '市场挂单'}>
                    {orders}
                </List>}

            </div>
        )
    }
}