import React, {Component} from 'react';
import {Modal, Flex, List, WhiteSpace, WingBlank, Icon} from "antd-mobile";
import 'semantic-ui-css/semantic.min.css';
import oAbi from '../oabi'
import {bytes32ToToken, formatDate, showValue} from "../common";
import BasePage from "../basepage";
import BigNumber from 'bignumber.js'
import language from '../language'

const alert = Modal.alert;

export class MyOrders extends BasePage {
    constructor(props) {
        super(props, {
            orders: []
        });
    }

    _componentDidMount(mainPKr) {
        let self = this;
        self.init(mainPKr);
        self.timer = setInterval(function () {
            self.init();
        }, 10 * 1000);
    }

    init(mainPKr) {
        let self = this;
        if (!mainPKr) {
            mainPKr = this.state.mainPKr;
        }
        oAbi.userOrders(mainPKr, true, function (orders) {
            orders.sort(function (a, b) {
                return b.order.updateTime - a.order.updateTime;
            });
            self.setState({orders: orders});
        });
    }

    render() {
        let self = this;
        let showOrders = this.state.orders.map((item, index) => {
            let text = "";
            if (item.order.status == 1) {
                text = language.e().order.tips1;
            } else if (item.order.status == 2) {
                let value = new BigNumber(item.order.price).multipliedBy(item.order.value).dividedBy(new BigNumber(10).pow(27)).toNumber();
                if (item.order.orderType == 0) {
                    text = language.e().order.tips2_0 + value + "CNY";
                } else {
                    text = <span>
                        {language.e().order.tips2_1}{value}CNY,
                        <a onClick={() => {
                            alert(language.e().order.pass, <span>请确认已经收到对方付款，应收:{value}CNY</span>, [
                                {text: language.e().modal.cancel, onPress: () => console.log('cancel')},
                                {
                                    text: language.e().modal.ok, onPress: () => {
                                        oAbi.finished(self.state.pk, self.state.mainPKr, item.id);
                                    }
                                }
                            ]);
                        }}>{language.e().order.pass}</a>
                    </span>
                }
            } else if (item.order.status == 3) {
                text = language.e().order.tips3;
            } else if (item.order.status == 4) {
                text = language.e().order.tips4;
            } else if (item.order.status == 5) {
                text = language.e().order.tips5;
            }
            let status = <span>{text}
                {
                    item.order.status == 1 && <span>
                        <a onClick={() => {
                            alert(language.e().order.tips7, <span>ID:{item.id},{language.e().order.tips6}</span>, [
                                {text: language.e().modal.cancel, onPress: () => console.log('cancel')},
                                {
                                    text: language.e().modal.ok, onPress: () => {
                                        oAbi.userCancel(this.state.pk, this.state.mainPKr, item.id);
                                    }
                                },
                            ])
                        }
                        }>,撤消</a>
                    </span>
                }
            </span>
            return <div className="item" key={index}>
                <WhiteSpace/>
                <div>
                    <Flex>
                        <Flex.Item
                            style={{flex: 2}}>{item.order.orderType == 0 ? language.e().order.buy : language.e().order.sell} {bytes32ToToken(item.order.token)}</Flex.Item>
                        <Flex.Item style={{flex: 1}}>ID: {item.id}</Flex.Item>
                        <Flex.Item style={{flex: 3, textAlign: 'right'}}>{status}</Flex.Item>
                    </Flex>
                </div>
                <WhiteSpace/>
                <div>
                    <Flex>
                        <Flex.Item>{showValue(item.order.price, 9, 4)}CNY</Flex.Item>
                        <Flex.Item>
                            {item.order.status == 2 &&
                            <span>
                                <a onClick={() => {
                                    alert('KYC', <span>{item.hcode}, {item.ecode}</span>, [
                                        {text: language.e().modal.cancel, onPress: () => console.log('cancel')},
                                        {text: language.e().modal.ok, onPress: () => console.log('ok')},
                                    ])
                                }
                                }>KYC</a> |
                            </span>
                            }
                            <a onClick={() => {
                                alert(language.e().order.tips8, <span>{item.hcode}</span>, [
                                    {text: language.e().modal.cancel, onPress: () => console.log('cancel')},
                                    {text: language.e().modal.ok, onPress: () => console.log('ok')},
                                ])
                            }}>{language.e().order.tips8}</a></Flex.Item>
                    </Flex>
                </div>
                <WhiteSpace/>
                <div>
                    <Flex>
                        <Flex.Item style={{flex: 2}}>
                            <div>{language.e().order.time}</div>
                            <div>{formatDate(new Date(item.order.updateTime * 1000))}</div>
                        </Flex.Item>
                        <Flex.Item style={{flex: 1}}>
                            <div>{language.e().order.price}</div>
                            <div>{showValue(item.order.price, 9, 4)}</div>
                        </Flex.Item>
                        <Flex.Item style={{flex: 1, textAlign: 'right'}}>
                            <div>{language.e().order.amount}</div>
                            <div>{showValue(item.order.value, 18, 4)}</div>
                        </Flex.Item>
                    </Flex>
                </div>
            </div>
        });
        return (
            <div className="ui divided list">{showOrders&&showOrders.length>0?showOrders:<List.Item>
                <div style={{textAlign:'center'}}>
                    <Icon type="iconnodata-topic" style={{width:"100px",height:"100px"}}/>
                </div>
            </List.Item>}</div>
        )
    }
}