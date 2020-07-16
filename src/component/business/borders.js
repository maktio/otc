import React, {Component} from 'react';
import 'semantic-ui-css/semantic.min.css';
import oAbi from '../oabi'
import {Badge, Brief, Button, Card, Flex, Icon, List, Modal, Radio, WhiteSpace} from "antd-mobile";
import {bytes32ToToken, showValue} from "../common";
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
            orderId: null
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
                        if(!self.timer) {
                            self.timer = setInterval(function () {
                                self.init();
                            }, 10 * 1000);
                        }
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
        oAbi.businessOrderList(mainPKr, "", 0, true, function (orders) {
            if (orders) {
                orders.sort(function (a, b) {
                    return b.order.createTime - a.order.createTime;
                });
                self.setState({orders: orders});
            } else {
                let item = {
                    order: {
                        value: 2e18, dealtValue: 0, price: 1e10, orderType: 0,
                        status: 0, token: "SUSD", unit: 0
                    }, underwayCount: 1
                }
                self.setState({orders: [item]});
            }
        });
    }

    back() {
        this.setState({orderId: null});
    }

    render() {
        let self = this;
        let orders = this.state.orders.map((item, index) => {
            // let num = 0;
            let canCancel = item.order.status == 0 && item.underwayCount == 0;
            let underway = item.order.status == 0 && new BigNumber(item.order.value).comparedTo(new BigNumber(item.order.dealtValue)) > 0;
            let status = "进行中";
            if (!underway) {
                status = item.order.status == 4 ? "已取消" : "已完成";
            }

            let closeStyle={color:'#ddd'};

            return (
                <div className="item" key={index}>
                    <Card>
                        <Card.Header
                            title={
                                <span style={!underway ? closeStyle : {}}>{item.order.orderType == 0 ? language.e().order.buy : language.e().order.sell}{bytes32ToToken(item.order.token)}
                        </span>}
                            extra={
                                <div className="ui breadcrumb" style={!underway ? closeStyle : {}}>
                                    <div className="section">ID:{item.id}</div>
                                    <div className="divider"></div>
                                    <div className="section">{canCancel ? <a onClick={() => {
                                        alert(language.e().order.cancel, <span>ID:{item.id}</span>, [
                                            {text: language.e().modal.cancel, onPress: () => console.log('cancel')},
                                            {
                                                text: language.e().modal.ok, onPress: () => {
                                                    oAbi.businessCancel(this.state.pk, this.state.mainPKr, item.id);
                                                }
                                            },
                                        ])
                                    }
                                    }>撤消</a> : status}</div>
                                </div>
                            }
                        />
                        <Card.Body>
                            <div style={!underway ? closeStyle : {}}>
                                <Flex>
                                    <Flex.Item>数量({bytes32ToToken(item.order.token)})</Flex.Item>
                                    <Flex.Item>价格({oAbi.unitName(item.order.unit)})</Flex.Item>
                                    <Flex.Item>成交量</Flex.Item>
                                </Flex>
                                <Flex>
                                    <Flex.Item>{showValue(item.order.value, 18, 4)}</Flex.Item>
                                    <Flex.Item>{showValue(item.order.price, 9, 4)}</Flex.Item>
                                    <Flex.Item>{showValue(item.order.dealtValue, 18, 4)}</Flex.Item>
                                </Flex>

                            </div>
                        </Card.Body>
                        <Card.Footer extra={<span style={!underway ? closeStyle : {}}>

                            <span onClick={() => {
                                self.setState({orderId: item.id, orderType: item.order.orderType});
                            }}>处理中订单数量 {
                                    item.underwayCount == 0 ? item.underwayCount :
                                        <Badge text={item.underwayCount} overflowCount={100}/>
                                }
                            </span>
                        </span>}/>
                    </Card>
                </div>

            )
        });

        return (
            <div className="ui segment">
                {
                    this.state.orderId != null ?
                        <UserOrders orderId={this.state.orderId} back={this.back.bind(this)} code={this.state.code} orderType={this.state.orderType}/> :
                        <div className="ui list">
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