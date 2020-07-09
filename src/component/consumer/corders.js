import React, {Component} from 'react';
import {Modal, Flex, WhiteSpace, Icon, Card} from "antd-mobile";
import 'semantic-ui-css/semantic.min.css';
import oAbi from '../oabi'
import {bytes32ToToken, formatDate, showValue} from "../common";
import BigNumber from 'bignumber.js'
import language from '../language'
import Iframe from "react-iframe";

const alert = Modal.alert;

export class COrders extends Component {
    constructor(props) {
        super(props);
        this.state = {pk: this.props.pk, orders: []}
    }

    componentDidMount() {
        let self = this;
        oAbi.init
            .then(() => {
                oAbi.accountDetails(this.state.pk, function (account) {
                    oAbi.myKyc(account.pk, account.mainPKr, function (code, pcode, hasAudited) {
                        self.setState({mainPKr: account.mainPKr, code: code, pcode: pcode, hasAudited: hasAudited});
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
        oAbi.userOrderList(mainPKr, function (orders) {
            if(orders) {
                orders.sort(function (a, b) {
                    return b.order.updateTime - a.order.updateTime;
                });
                self.setState({orders: orders});
            }
        });
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
            } else if (item.order.status == 6) {
                text = "仲裁中"
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
                <Card>
                    <Card.Header
                        title={
                            <span>{item.order.orderType == 0 ? language.e().order.buy : language.e().order.sell} {bytes32ToToken(item.order.token)}</span>}
                        extra={<div><span style={{float: 'left'}}>ID: {item.id}</span>&nbsp;&nbsp;&nbsp;<span
                            style={{textAlign: 'right'}}>{status}</span></div>}
                    />
                    <Card.Body>
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
                    </Card.Body>
                    <Card.Footer extra={<div>
                         <span>
                        {item.order.status == 2 ?

                            <a onClick={() => {
                                oAbi.pkrDecrypt(self.state.pk, item.mcode, function (code1) {
                                    let url = "https://ahoj.xyz/levelInfo/code1/" + code1 + "?lang=cn";
                                    Modal.alert('支付信息', <div>
                                        <Iframe url={url}
                                                width="100%"
                                                height="450px"
                                                display="initial"
                                                position="relative"/>
                                    </div>);
                                });
                            }
                            }>支付信息</a> : <a onClick={() => {
                                let url = "https://ahoj.xyz/levelInfo/code2/" + item.hcode + "?lang=cn";
                                Modal.alert(language.e().order.tips8, <div>
                                    <Iframe url={url}
                                            width="100%"
                                            height="450px"
                                            display="initial"
                                            position="relative"/>
                                </div>);
                            }}>{language.e().order.tips8}</a>
                        }
                         </span>
                    </div>}/>
                </Card>
            </div>
        });
        return (
            <div className="ui list">{showOrders && showOrders.length > 0 ? showOrders :
                <div style={{textAlign: 'center'}}>
                    <Icon type="iconnodata-topic" style={{width: "100px", height: "100px"}}/>
                </div>}</div>
        )
    }
}