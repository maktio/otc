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
        };
    }

    render() {
        let self = this;
        let code = this.props.code;
        let childs = this.props.order.childs.sort(function (a, b) {
            return b.order.updateTime - a.order.updateTime;
        });
        let ordersHtml = childs.map((child, index) => {
            let html;
            if (child.order.status == 1) {
                html = <div style={{textAlign: 'right'}}>
                    <a onClick={() => {
                        alert(language.e().order.confirm + "/" + language.e().order.refuse,
                            <Flex>
                                <Flex.Item style={{textAlign: "right"}}>
                                    <div className="ui radio checkbox">
                                        <input type="radio" ref={el => this.conform = el} name="op"
                                               checked="checked" onChange={() => {
                                        }}/>
                                        <label>{language.e().order.confirm}</label>
                                    </div>
                                </Flex.Item>
                                <Flex.Item>
                                    <div className="ui radio checkbox">
                                        <input type="radio" ref={el => this.refuse = el} name="op"
                                               onChange={() => {
                                               }}/>
                                        <label>{language.e().order.refuse}</label>
                                    </div>
                                </Flex.Item>
                            </Flex>
                            , [
                                {text: language.e().modal.cancel, onPress: () => console.log('cancel')},
                                {
                                    text: language.e().modal.ok, onPress: () => {
                                        if (this.conform.checked) {
                                            oAbi.pkrEncrypt(child.pkr, oAbi.code1(code), function (mcode) {
                                                oAbi.confirmed(self.state.pk, self.state.mainPKr, child.id, mcode);
                                            });
                                        } else {
                                            oAbi.refused(self.state.pk, self.state.mainPKr, child.id);
                                        }
                                    }
                                },
                            ]);
                    }}>
                        {language.e().order.op}
                    </a>
                </div>
            } else if (child.order.status == 2) {
                let value = new BigNumber(child.order.price).multipliedBy(child.order.value).dividedBy(new BigNumber(10).pow(27)).toNumber();
                if (child.order.orderType == 1) {
                    if (parseInt(new Date().getTime() / 1000) - child.order.updateTime < 24 * 60 * 60) {
                        html =
                            <span>{language.e().order.tips2_0},{value} CNY</span>
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
                                alert("请确认未收到付款!", <span>应收:{value} CNY</span>, [
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
                            >取消</a></span>
                    } else {
                        html = <span>{language.e().order.tips2_1}{value}CNY,<a onClick={() => {

                            alert(language.e().order.tips2_3, <span>应收:{value} CNY</span>, [
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
                }
                html = <span>{text}</span>
            }

            return <div key={index}>
                <Card>
                    <Card.Header
                        title={<span>订单号:{child.id}</span>}
                        extra={html}
                    />
                    <Card.Body>
                        <div>
                            <Flex style={{fontSize: '14px'}}>
                                <Flex.Item style={{flex: 1}}>{showValue(child.order.price, 9, 4)}</Flex.Item>
                                <Flex.Item style={{flex: 1}}>{showValue(child.order.value, 18, 4)}</Flex.Item>
                            </Flex>
                        </div>
                    </Card.Body>
                    <Card.Footer content={formatDate(new Date(child.order.updateTime * 1000))} extra={<span>
                        <a onClick={() => {
                            console.log("child.mcode",child.mcode);
                            oAbi.pkrDecrypt(self.state.pk, child.mcode, function (code1) {
                                if (oAbi.code2(code1) === child.hcode) {
                                    let url = "https://ahoj.xyz/level/code1/" + code1 + "?lang=cn";
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
                <WhiteSpace size="sm"/>
            </div>

        });
        let back = this.props.back;

        return (
            <div>
                <div>
                    <Button onClick={() => {
                        back();
                    }}>返回</Button><WhiteSpace/>
                </div>
                {ordersHtml}
            </div>


        )
    }
}