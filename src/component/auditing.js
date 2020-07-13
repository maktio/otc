import React, {Component} from 'react';
import {Button, Card, Flex, List, Modal, WhiteSpace, WingBlank} from "antd-mobile";
import 'semantic-ui-css/semantic.min.css';
import oAbi from './oabi'
import {showValue, formatDate, bytes32ToToken} from "./common";
import Iframe from "react-iframe";
import language from "./language";

export class AuditingList extends Component {

    constructor(props) {
        super(props);

        this.state = {
            orderInfo: null,
            orders: [],
            codes: [],

        }
    }

    componentWillReceiveProps(nextProps) {
        let self = this;
        if (nextProps.pk != this.props.pk) {
            oAbi.accountDetails(nextProps.pk, function (account) {
                self.setState({pk: nextProps.pk, mainPKr: account.mainPKr});
            });
        }
    }

    componentDidMount() {
        let self = this;
        oAbi.init
            .then(() => {
                oAbi.accountDetails(self.props.pk, function (account) {
                    self.setState({pk: account.pk, mainPKr: account.mainPKr});

                    oAbi.auditingList(self.state.mainPKr, function (codes) {
                        self.setState({codes: codes});
                    });
                    oAbi.arbitrateOrders(self.state.mainPKr, function (orders) {
                        self.setState({orders: orders});
                    });
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
        let roleType = this.props.roleType

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
                                    let url = "https://ahoj.xyz/levelInfo/code1/" + code1 + "?lang=cn";
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
                <div className="item" key={index}>

                    <Card>
                        <Card.Header
                            title={
                                <span>{item.order.orderType == 0 ? "买入" : "卖出"}{bytes32ToToken(item.order.token)}</span>}
                            extra={<span>ID:{item.id}
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
                            </span>}
                        />
                        <Card.Body>
                            <div style={{fontSize: '12px'}}>
                                <Flex>
                                    <Flex.Item
                                        style={{flex: 1}}>价格({oAbi.unitName(item.unit)})</Flex.Item>
                                    <Flex.Item style={{flex: 1}}>数量({bytes32ToToken(item.order.token)})</Flex.Item>

                                    <Flex.Item style={{flex: 1}}>支付</Flex.Item>
                                    <Flex.Item style={{flex: 1}}>时间

                                    </Flex.Item>
                                </Flex>
                                <Flex>
                                    <Flex.Item
                                        style={{flex: 1}}>{showValue(item.order.price, 9, 4)}</Flex.Item>
                                    <Flex.Item style={{flex: 1}}>{showValue(item.order.value, 18, 4)}</Flex.Item>

                                    <Flex.Item style={{flex: 1}}>{item.order.payType}</Flex.Item>
                                    <Flex.Item
                                        style={{flex: 1}}>{formatDate(new Date(item.order.updateTime * 1000))}</Flex.Item>
                                </Flex>
                            </div>

                        </Card.Body>
                    </Card>


                </div>

            )
        })

        if (roleType > 0) {
            return (
                <div style={{border: '1px solid #d4d4d5', paddingTop: '10px'}}>

                    {
                        roleType == 1 && <div className="ui action">
                            <WingBlank>
                            <textarea rows="6" cols="42" ref={el => this.auditorValue = el} onChange={(event) => {
                                this.auditorValue.value = event.target.value.trim();
                            }}></textarea>
                                <div className="ui submit button" onClick={() => {
                                    oAbi.setAuditor(this.state.pk, this.state.mainPKr, this.auditorValue.value);
                                }}>设置审核员
                                </div>
                            </WingBlank>
                            <WhiteSpace/>

                            <WingBlank>
                            <textarea rows="6" cols="42" ref={el => this.managerValue = el} onChange={(event) => {
                                this.managerValue.value = event.target.value.trim();
                            }}></textarea>
                                <div className="ui submit button" onClick={() => {
                                    oAbi.setManager(this.state.pk, this.state.mainPKr, this.managerValue.value, true);
                                }}>添加管理员
                                </div>
                            </WingBlank>
                            <WhiteSpace/>
                        </div>
                    }

                    {
                        (roleType == 1 || roleType == 3) && <div><WingBlank>
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
                                }}>仲裁
                                </button>
                            </div>
                            <WhiteSpace/>
                            {
                                this.state.orderInfo && <Flex>
                                    <Flex.Item
                                        style={{flex: 1}}>{this.state.orderInfo.orderType == 0 ? "买入" : "卖出"}</Flex.Item>
                                    <Flex.Item
                                        style={{flex: 1}}>{showValue(this.state.orderInfo.order.price, 9, 4)} {oAbi.unitName(this.state.orderInfo.unit)}</Flex.Item>
                                    <Flex.Item
                                        style={{flex: 1}}>{showValue(this.state.orderInfo.order.value, 18, 4)}</Flex.Item>

                                    <Flex.Item
                                        style={{flex: 1}}>{this.showStatus(this.state.orderInfo.order.status)}</Flex.Item>
                                    <Flex.Item style={{flex: 1}}>{this.state.orderInfo.order.payType}</Flex.Item>
                                    <Flex.Item
                                        style={{flex: 3}}>{formatDate(new Date(this.state.orderInfo.order.updateTime * 1000))}</Flex.Item>
                                </Flex>
                            }
                        </WingBlank>
                            <WhiteSpace/>
                            <WingBlank>
                                <div className="ui list">
                                    {ordersHtml}
                                </div>
                            </WingBlank>
                            <WhiteSpace/>
                        </div>
                    }


                    {
                        (roleType == 1 || roleType == 2) && <WingBlank>

                            <List renderHeader={() => '审核列表'} className="my-list">
                                {list}
                            </List>
                        </WingBlank>
                    }
                </div>
            )
        } else {
            return ""
        }

    }
}