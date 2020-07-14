import React, {Component} from 'react';
import 'semantic-ui-css/semantic.min.css';
import oAbi from '../oabi'
import {Brief, Button, Card, Flex, Icon, List, Modal, Radio, WhiteSpace} from "antd-mobile";
import {bytes32ToToken, randomByte32, showValue, formatDate} from "../common";
import BigNumber from 'bignumber.js'
import language from '../language'
import Iframe from "react-iframe";

const alert = Modal.alert;

export class UserOrders extends Component {
    constructor(props) {
        super(props);
        this.state = {
            pk: localStorage.getItem("PK"),
            mainPKr: localStorage.getItem("MAINPKR"),
            orders: [],
            loading:false
        };
    }

    reload(callback) {
        let self = this;
        oAbi.userOrderListByBId(this.state.mainPKr, this.props.orderId, function (orders) {
            orders.sort(function (a, b) {
                return b.order.updateTime - a.order.updateTime;
            });

            if (orders.length > 0) {
                let pkrs = [];
                orders.forEach(item => {
                    item.pkr = "0x" + item.order.owner.slice(-40);
                    pkrs.push(item.pkr);
                });

                oAbi.getFullAddress(pkrs, function (rets) {
                    orders.forEach(item => {
                        item.pkr = rets.result[item.pkr];
                    });
                });
            }
            self.setState({orders: orders});
            if (callback) {
                callback();
            }
        })
    }
    componentDidMount() {
        this.reload();
    }

    render() {
        let self = this;
        const {code, orderType} = this.props;
        let ordersHtml = this.state.orders.map((child, index) => {
            let html;
            if (child.order.status == 1) {
                html = <div className="ui breadcrumb">
                    <a className="section" onClick={() => {
                        alert(language.e().order.confirm, ''
                            , [
                                {text: language.e().modal.cancel, onPress: () => console.log('cancel')},
                                {
                                    text: language.e().modal.ok, onPress: () => {

                                        oAbi.pkrEncrypt(child.pkr, oAbi.code1(code), function (mcode) {
                                            oAbi.confirmed(self.state.pk, self.state.mainPKr, child.id, mcode);
                                        });

                                    }
                                },
                            ]);
                    }}>{language.e().order.confirm}</a>
                    <div className="divider"></div>
                    <a className="section" onClick={() => {
                        alert(language.e().order.refuse, ""
                            , [
                                {text: language.e().modal.cancel, onPress: () => console.log('cancel')},
                                {
                                    text: language.e().modal.ok, onPress: () => {
                                        oAbi.refused(self.state.pk, self.state.mainPKr, child.id);
                                    }
                                },
                            ]);
                    }}>{language.e().order.refuse}</a>
                </div>
            } else if (child.order.status == 2) {
                let value = new BigNumber(child.order.price).multipliedBy(child.order.value).dividedBy(new BigNumber(10).pow(27)).toNumber();
                if (child.order.orderType == 1) {
                    if (parseInt(new Date().getTime() / 1000) - child.order.updateTime < 24 * 60 * 60) {
                        html =
                            <span>{language.e().order.tips2_0},{value} {oAbi.unitName(child.unit)}</span>
                    } else {
                        html = <span>超时放行,<a onClick={() => {
                            alert("结束订单", <span>ID:{child.id}</span>, [
                                {text: language.e().modal.cancel, onPress: () => console.log('cancel')},
                                {
                                    text: language.e().modal.ok, onPress: () => {
                                        oAbi.finished(self.state.pk, self.state.mainPKr, child.id);
                                    }
                                },
                            ]);
                        }}>完成</a></span>
                    }
                } else {
                    if (parseInt(new Date().getTime() / 1000) - child.order.updateTime > 24 * 60 * 60) {
                        html =
                            <span>{language.e().order.tips2_4},<a onClick={() => {
                                alert("请确认未收到付款!", <span>应收:{value} {oAbi.unitName(child.unit)}</span>, [
                                    {
                                        text: language.e().modal.cancel, onPress: () => {
                                        }
                                    },
                                    {
                                        text: language.e().modal.ok, onPress: () => {
                                            oAbi.refused(self.state.pk, self.state.mainPKr, child.id);
                                        }
                                    }
                                ])
                            }}
                            >超时取消</a></span>
                    } else {
                        html = <span>{language.e().order.tips2_1}{value} {oAbi.unitName(child.unit)},<a onClick={() => {

                            alert(language.e().order.tips2_3, <span>应收:{value} {oAbi.unitName(child.unit)}</span>, [
                                {
                                    text: language.e().modal.cancel, onPress: () => {
                                    }
                                },
                                {
                                    text: language.e().modal.ok, onPress: () => {
                                        oAbi.finished(self.state.pk, self.state.mainPKr, child.id);
                                    }
                                },
                            ]);
                        }}>{language.e().order.pass}</a>
                            </span>
                    }
                }
            } else {
                let text;
                if (child.order.status == 3) {
                    text = language.e().order.tips3;
                } else if (child.order.status == 4) {
                    text = language.e().order.tips4;
                } else if (child.order.status == 5) {
                    text = language.e().order.tips5;
                } if (child.order.status == 6) {
                    text = "仲裁中"
                }
                html = <span>{text}</span>
            }

            return <div className="item" key={index}>
                <Card>
                    <Card.Header
                        title={
                            <div className="ui breadcrumb">
                                <div className="section">ID:{child.id}</div>
                                <div className="divider"></div>
                                <div className="active section">{child.name}</div>
                            </div>
                        }
                        extra={html}
                    />
                    <Card.Body>
                        <div>
                            <Flex style={{fontSize: '14px'}}>
                                <Flex.Item style={{flex: 1}}>{showValue(child.order.price, 9, 4)}{oAbi.unitName(child.unit)}</Flex.Item>
                                <Flex.Item style={{flex: 1}}>{showValue(child.order.value, 18, 4)} {bytes32ToToken(child.order.token)}</Flex.Item>
                            </Flex>
                        </div>
                    </Card.Body>
                    <Card.Footer content={formatDate(new Date(child.order.updateTime * 1000))} extra={<span>
                        <a onClick={() => {
                            oAbi.pkrDecrypt(self.state.pk, child.mcode, function (code1) {
                                if (oAbi.code2(code1) === child.hcode) {
                                    let url = "https://ahoj.xyz/levelInfo/code1/" + code1 + "?lang=cn&pcindex"+child.order.payType;
                                    Modal.alert('', <Iframe url={url}
                                                            width="100%"
                                                            height="450px"
                                                            display="initial"
                                                            position="relative"/>);
                                }
                            });
                        }}>支付信息</a>
                    </span>}/>
                </Card>
            </div>

        });
        let back = this.props.back;

        return (
            <div>
                <div>
                    <Flex>
                        <Flex.Item style={{textAlign:'left',paddingLeft:'5px'}}><a onClick={() => {
                            back();
                        }}><img src={require('../icon/back.png')} style={{width:"25px",height:"20px"}}/></a></Flex.Item>
                        <Flex.Item style={{textAlign: 'center', fontWeight: 'bold'}}>
                            {orderType == 0 ? "买入" : "卖出"}
                        </Flex.Item>
                        <Flex.Item style={{textAlign:'right',paddingRight:'5px'}}>
                            <a onClick={() => {
                                self.setState({loading:true})
                                self.reload(function () {
                                    self.setState({loading:false})
                                });
                            }}>{
                                this.state.loading ?<Icon type={'loading'} />:
                                <img src={require('../icon/refurbish.png')} style={{width:"20px",height:"20px"}}/>
                            }
                            </a>
                        </Flex.Item>
                    </Flex>
                    <WhiteSpace/>
                </div>
                <div className="ui list">
                    {ordersHtml}
                </div>

            </div>


        )
    }
}