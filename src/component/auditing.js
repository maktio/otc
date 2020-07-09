import React, {Component} from 'react';
import {Button, Flex, List, Modal, WhiteSpace, WingBlank} from "antd-mobile";
import 'semantic-ui-css/semantic.min.css';
import oAbi from './oabi'
import {hash, showValue, formatDate} from "./common";
import Iframe from "react-iframe";
import language from "./language";
import BigNumber from "bignumber.js";

export class AuditingList extends Component {

    constructor(props) {
        super(props);

        this.state = {
            pk: localStorage.getItem("PK"),
            mainPKr: localStorage.getItem("MAINPKR"),
            orderInfo: null,
            orders: [],
            codes: []
        }
    }

    componentDidMount() {
        let self = this;
        oAbi.init
            .then(() => {
                oAbi.auditingList(self.state.mainPKr, function (codes) {
                    self.setState({codes: codes});
                });
                oAbi.arbitrateOrders(self.state.mainPKr, function (orders) {
                    self.setState({orders: orders});
                });
            });
    }

    showStatus(status) {
        let text = "";
        if (status == 1) {
            text = language.e().order.tips1;
        } else if (status == 2) {
            return "已确定"
        } else if (status == 3) {
            text = language.e().order.tips3;
        } else if (status == 4) {
            text = language.e().order.tips4;
        } else if (status == 5) {
            text = language.e().order.tips5;
        } else if (status == 6) {
            text = "仲裁中"
        }
        return text;
    }

    render() {
        let self = this;
        let list = this.state.codes.map((item, index) => {

            return (
                <List.Item key={index}>
                    <Flex>
                        <Flex.Item style={{flex: 3}}>
                            <div style={{
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                            }}>{item.hcode}</div>
                        </Flex.Item>
                        <Flex.Item style={{flex: 1, textAlign: 'right'}}><a onClick={() => {
                            oAbi.pkrDecrypt(self.state.pk, item.pcode, function (code1) {
                                if (oAbi.code2(code1) === item.hcode) {
                                    let url = "https://ahoj.xyz/level/code1/" + code1 + "?lang=cn";
                                    Modal.alert('', <Iframe url={url}
                                                            width="100%"
                                                            height="450px"
                                                            display="initial"
                                                            position="relative"/>, [
                                        {
                                            text: '拒绝', onPress: () => {
                                                oAbi.audited(self.state.pk, self.state.mainPKr, [item.hcode], false);
                                            }
                                        },
                                        {
                                            text: '通过', onPress: () => {
                                                oAbi.audited(self.state.pk, self.state.mainPKr, [item.hcode], true);
                                            }
                                        },
                                    ]);
                                }
                            });
                        }}>check</a>
                        </Flex.Item>
                    </Flex>
                </List.Item>
            )
        });

        let ordersHtml = this.state.orders.map((item, index) => {
            return (
                <List.Item key={index}>
                    <Flex>
                        <Flex.Item
                            style={{flex: 1}}>{item.order.orderType ==0?"买入":"卖出"}</Flex.Item>
                        <Flex.Item style={{flex: 1}}>{item.id}</Flex.Item>
                        <Flex.Item style={{flex: 1}}>{showValue(item.order.price, 9, 4)} {oAbi.unitName(item.order.unit)}</Flex.Item>
                        <Flex.Item style={{flex: 1}}>{showValue(item.order.value, 18, 4)}</Flex.Item>

                        <Flex.Item style={{flex: 1}}>{item.order.payType}</Flex.Item>
                        <Flex.Item style={{flex: 1}}>
                            <a size="small" onClick={() => {
                                Modal.operation([
                                    {
                                        text: '用户胜诉', onPress: () => {
                                            oAbi.executeArbitrate(this.state.pk, this.state.mainPKr, item.id, 0);
                                        }
                                    },
                                    {
                                        text: '商家胜诉', onPress: () => {
                                            oAbi.executeArbitrate(this.state.pk, this.state.mainPKr, item.id, 1);
                                        }
                                    },
                                ])
                            }}>仲裁</a>
                        </Flex.Item>
                    </Flex>
                </List.Item>

            )
        })

        return (
            <div style={{border: '1px solid #d4d4d5', paddingTop: '10px'}}>
                <WingBlank>
                    <div className="ui action input">
                        <input type="text" placeholder="order id" ref={el => this.orderIdValue = el}
                               onChange={(event) => {
                                   this.orderIdValue.value = event.target.value;
                               }}/>
                        <button className="ui button" onClick={() => {
                            oAbi.orderInfo(this.state.mainPKr, this.orderIdValue.value, function (orderInfo) {
                                self.setState({orderInfo: orderInfo});
                            })
                        }}>查看
                        </button>
                        <button className="ui button" onClick={() => {
                            oAbi.arbitrate(this.state.pk, this.state.mainPKr, this.orderIdValue.value);
                        }}>仲裁</button>
                    </div>
                    <WhiteSpace/>
                    {

                        this.state.orderInfo && <Flex>
                            <Flex.Item
                                style={{flex: 1}}>{this.state.orderInfo.orderType ==0?"买入":"卖出"}</Flex.Item>
                            <Flex.Item
                                style={{flex: 1}}>{showValue(this.state.orderInfo.price, 9, 4)} {oAbi.unitName(this.state.orderInfo.unit)}</Flex.Item>
                            <Flex.Item style={{flex: 1}}>{showValue(this.state.orderInfo.value, 18, 4)}</Flex.Item>

                            <Flex.Item style={{flex: 1}}>{this.showStatus(this.state.orderInfo.status)}</Flex.Item>
                            <Flex.Item style={{flex: 1}}>{this.state.orderInfo.payType}</Flex.Item>
                            <Flex.Item
                                style={{flex: 3}}>{formatDate(new Date(this.state.orderInfo.updateTime * 1000))}</Flex.Item>
                        </Flex>
                    }
                </WingBlank>
                <WhiteSpace/>
                <WingBlank>
                    <List renderHeader={() => '仲裁列表'} className="my-list">
                        {ordersHtml}
                    </List>

                </WingBlank>
                <WhiteSpace/>
                <WingBlank>
                    <List renderHeader={() => '审核列表'} className="my-list">
                        {list}
                    </List>
                </WingBlank>
            </div>
        )
    }
}