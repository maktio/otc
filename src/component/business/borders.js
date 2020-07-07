import React, {Component} from 'react';
import 'semantic-ui-css/semantic.min.css';
import oAbi from '../oabi'
import {Brief, Button, Card, Flex, Icon, List, Modal, Radio, WhiteSpace} from "antd-mobile";
import {bytes32ToToken, randomByte32, showValue, formatDate} from "../common";
import BasePage from "../basepage";
import BigNumber from 'bignumber.js'
import language from '../language'
import {UserOrders} from "./userorders";

const alert = Modal.alert;

export class BOrders extends Component {
    constructor(props) {
        super(props);
        this.state = {
            pk: this.props.pk,
            orders: [],
            order: null
        }
    }

    componentWillReceiveProps(nextProps) {
        let self = this;
        if (nextProps.pk != this.props.pk) {
            oAbi.accountDetails(nextProps.pk, function (account) {
                oAbi.myKyc(account.pk, account.mainPKr, function (code) {
                    self.setState({pk: nextProps.pk, mainPKr: account.mainPKr, code: code});
                    self.init(account.mainPKr);
                })
            });
        }
    }

    componentDidMount() {
        let self = this;
        oAbi.init
            .then(() => {
                oAbi.accountDetails(this.state.pk, function (account) {
                    oAbi.myKyc(account.pk, account.mainPKr, function (code) {
                        self.setState({pk: account.pk, mainPKr: account.mainPKr, code: code});
                        self.init(account.mainPKr);
                        self.timer = setInterval(function () {
                            self.init();
                        }, 10 * 1000);
                    });
                });
            });
    }

    componentWillUnmount() {
        if (this.timer) {
            clearInterval(this.timer);
        }
    }

    init(mainPKr) {
        let self = this;
        if (!mainPKr) {
            mainPKr = this.state.mainPKr;
        }
        oAbi.businessOrders(mainPKr, "", 0, true, function (orders) {
            orders.sort(function (a, b) {
                return b.order.timestemp - a.order.timestemp;
            });
            if (orders.length > 0) {
                let orderMap = new Map();
                orders.forEach(item => {
                    item.childs = [];
                    orderMap.set(item.id, item);
                });
                oAbi.userOrders(mainPKr, false, function (childs) {
                    if (childs.length > 0) {
                        let pkrs = [];
                        childs.forEach(item => {
                            item.pkr = "0x" + item.order.owner.slice(-40);
                            pkrs.push(item.pkr);
                            orderMap.get(item.order.businessOrderId).childs.push(item);
                        });

                        oAbi.getFullAddress(pkrs, function (rets) {
                            childs.forEach(item => {
                                item.pkr = rets.result[item.pkr];
                            });
                            self.setState({orders: orders});
                        });
                    } else {
                        self.setState({orders: orders});
                    }
                });
            } else {
                self.setState({orders: []});
            }
        });
    }

    back() {
        this.setState({order: null});
    }

    render() {
        let self = this;
        let orders = this.state.orders.map((item, index) => {
            let num = 0;
            let canCancel = true;
            let underway = item.order.status == 0 && new BigNumber(item.order.value).comparedTo(new BigNumber(item.order.dealtValue)) > 0;
            if (underway && item.childs && item.childs.length > 0) {
                item.childs.map((child, cindex) => {
                    if (child.order.status == 1 || child.order.status == 2) {
                        canCancel = false;
                        num++;
                    }
                });
            }
            let status = "进行中";
            if (!underway) {
                canCancel = false;
                status = item.order.status == 4 ? "已取消" : "已完成";
            }

            return <div className="item" key={index}>
                <Flex style={{fontSize: '12px'}}>
                    <Flex.Item
                        style={{flex: 1}}>{item.id}</Flex.Item>
                    <Flex.Item
                        style={{flex: 2}}>{item.order.orderType == 0 ? language.e().order.buy : language.e().order.sell}{bytes32ToToken(item.order.token)}</Flex.Item>
                    <Flex.Item style={{flex: 1}}>{showValue(item.order.price, 9, 4)}  {oAbi.unitName(item.order.unit)}</Flex.Item>
                    <Flex.Item style={{flex: 1}}>{showValue(item.order.value, 18, 4)}</Flex.Item>
                    <Flex.Item style={{flex: 1}}>
                        {
                            canCancel ? <a onClick={() => {
                                alert(language.e().order.cancel, <span>ID:{item.id}</span>, [
                                    {text: language.e().modal.cancel, onPress: () => console.log('cancel')},
                                    {
                                        text: language.e().modal.ok, onPress: () => {
                                            oAbi.businessCancel(this.state.pk, this.state.mainPKr, item.id);
                                        }
                                    },
                                ])
                            }
                            }>撤消</a> : status
                        }
                    </Flex.Item>
                    <Flex.Item style={{flex: 1}}>{num}</Flex.Item>
                    <Flex.Item style={{flex: 1, textAlign: 'right'}}><a onClick={() => {
                        self.setState({order: item});
                    }}><Icon type="right"/></a></Flex.Item>
                </Flex>
            </div>
        });

        return (
            <div className="ui segment">
                {
                    this.state.order != null ? <UserOrders order={this.state.order} back={this.back.bind(this)} code={this.state.code}/> :
                        <div className="ui list">
                            <div className="item">
                                <Flex style={{fontSize: '12px', fontWeight: 'bold'}}>
                                    <Flex.Item
                                        style={{flex: 1}}>ID</Flex.Item>
                                    <Flex.Item
                                        style={{flex: 2}}>{language.e().order.orderType}</Flex.Item>
                                    <Flex.Item style={{flex: 1}}>{language.e().order.price}</Flex.Item>
                                    <Flex.Item style={{flex: 1}}>{language.e().order.amount}</Flex.Item>
                                    <Flex.Item style={{flex: 1}}>状态</Flex.Item>
                                    <Flex.Item style={{flex: 1}}>交易</Flex.Item>
                                    <Flex.Item style={{flex: 1}}></Flex.Item>
                                </Flex>
                            </div>
                            {
                                orders && orders.length > 0 ? orders :
                                    <div className="item" style={{textAlign: 'center'}}>
                                        <Icon type="iconnodata-topic" style={{width: "100px", height: "100px"}}/>
                                    </div>
                            }
                        </div>
                }
            </div>
        )
    }
}