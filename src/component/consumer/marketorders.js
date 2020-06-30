import React, {Component} from 'react';
import {Button, Flex, List, Modal, SegmentedControl, Toast, WhiteSpace, Card, Icon} from "antd-mobile";
import 'semantic-ui-css/semantic.min.css';
import oAbi from '../oabi'
import BigNumber from "bignumber.js";
import {randomByte32, showValue} from "../common";
import BasePage from "../basepage";
import language from '../language'

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

    init(mainPKr, token) {
        let self = this;
        if (!token) {
            token = this.state.token;
        }
        if (!token) {
            return;
        }

        oAbi.businessOrders(this.state.mainPKr, token, this.state.unit, false, function (orders) {
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
                self.setState({sellOrders: [], buyOrders: []});
            }
        });
    }

    render() {
        let self = this;
        const {token} = this.state;
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
        if (orderType == 0) {
            orders = this.state.buyOrders;
        } else {
            orders = this.state.sellOrders;
        }


        let showOrders = orders.map((item, index) => {
            let value = item.order.value - item.order.dealtValue-item.order.lockinValue;
            return (
                <List.Item key={index}>
                    <Card>
                        <Card.Header
                            title={item.name}
                            extra={<span onClick={() => {
                                alert('联系方式', <span>{item.hcode}</span>, [
                                    {text: language.e().modal.cancel, onPress: () => console.log('cancel')},
                                    {text: language.e().modal.ok, onPress: () => console.log('ok')},
                                ])
                            }}>联系</span>}
                        />
                        <Card.Body>
                            <div style={{fontSize:"14px",fontWeight:"800"}}>{showValue(item.order.price, 9, 4)} CNY</div>
                        </Card.Body>
                        <Card.Footer content={
                            <div>
                                <div>数量: {showValue(value, 18, 4)}</div>
                                <div>限额: {showValue(item.order.minDealValue, 18, 0)}-{showValue(item.order.maxDealValue, 18, 4)}</div>
                            </div>
                        } extra={
                            <Button type="ghost" inline size="small" style={{marginRight: '4px'}}
                                    onClick={() => {
                                        if (!this.state.ecode) {
                                            this.kyc();
                                        } else {
                                            // <div className="ui input"><input type="text" placeholder="amount"
                                            //                                  onChange={(event) => {
                                            //                                      let value = event.target.value;
                                            //                                      if (value) {
                                            //                                          value = (value.match(/^\d*(\.?\d{0,4})/g)[0]) || null
                                            //                                      }
                                            //                                      this.amountValue.value = value;
                                            //                                  }}
                                            //                                  ref={el => this.amountValue = el}/>

                                            // </div>

                                            let options = values.map((value, index) => {
                                                if (new BigNumber(value).multipliedBy(new BigNumber(10).pow(18)).comparedTo(new BigNumber(item.order.value - item.order.dealtValue)) <= 0) {
                                                    return (
                                                        <option key={index} value={value}>{value}</option>
                                                    )
                                                }
                                            });
                                            Modal.alert(<span>{orderType == 0 ? language.e().order.sell : language.e().order.buy}</span>,
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
                                                            //ecode
                                                            let code = randomByte32();
                                                            if (orderType == 1) {
                                                                oAbi.exchangeBuy(this.state.pk, this.state.mainPKr, code, item.id, amount);
                                                            } else {
                                                                oAbi.exchangeSell(this.state.pk, this.state.mainPKr, code, item.id, this.state.token, amount);
                                                            }
                                                        }
                                                    },
                                                ])
                                        }

                                    }}>
                                {orderType == 0 ? language.e().order.sell : language.e().order.buy}
                            </Button>
                        } />
                    </Card>


                    {/*<div>{item.name}</div>*/}
                    {/*<div>*/}
                    {/*    <Flex>*/}
                    {/*        <Flex.Item>{showValue(item.order.price, 9, 4)}</Flex.Item>*/}
                    {/*        <Flex.Item style={{textAlign: 'right'}}>*/}
                    {/*            <a onClick={() => {*/}
                    {/*                alert('联系方式', <span>{item.hcode}</span>, [*/}
                    {/*                    {text: language.e().modal.cancel, onPress: () => console.log('cancel')},*/}
                    {/*                    {text: language.e().modal.ok, onPress: () => console.log('ok')},*/}
                    {/*                ])*/}
                    {/*            }}>联系</a>*/}
                    {/*        </Flex.Item>*/}
                    {/*    </Flex>*/}
                    {/*</div>*/}
                    {/*<WhiteSpace/>*/}
                    {/*<div>*/}
                    {/*    <Flex>*/}
                    {/*        <Flex.Item>*/}
                    {/*            <div>数量:{showValue(value, 18, 4)}</div>*/}
                    {/*            <div>限额:{showValue(item.order.minDealValue, 18, 0)}-{showValue(item.order.maxDealValue, 18, 4)}</div>*/}
                    {/*        </Flex.Item>*/}
                    {/*        <Flex.Item style={{textAlign: 'right'}}>*/}
                    {/*            <Button type="ghost" inline size="small" style={{marginRight: '4px'}}*/}
                    {/*                    onClick={() => {*/}
                    {/*                        if (!this.state.ecode) {*/}
                    {/*                            this.kyc();*/}
                    {/*                        } else {*/}
                    {/*                            // <div className="ui input"><input type="text" placeholder="amount"*/}
                    {/*                            //                                  onChange={(event) => {*/}
                    {/*                            //                                      let value = event.target.value;*/}
                    {/*                            //                                      if (value) {*/}
                    {/*                            //                                          value = (value.match(/^\d*(\.?\d{0,4})/g)[0]) || null*/}
                    {/*                            //                                      }*/}
                    {/*                            //                                      this.amountValue.value = value;*/}
                    {/*                            //                                  }}*/}
                    {/*                            //                                  ref={el => this.amountValue = el}/>*/}

                    {/*                            // </div>*/}

                    {/*                            let options = values.map((value, index) => {*/}
                    {/*                                if (new BigNumber(value).multipliedBy(new BigNumber(10).pow(18)).comparedTo(new BigNumber(item.order.value - item.order.dealtValue)) <= 0) {*/}
                    {/*                                    return (*/}
                    {/*                                        <option key={index} value={value}>{value}</option>*/}
                    {/*                                    )*/}
                    {/*                                }*/}
                    {/*                            });*/}
                    {/*                            Modal.alert(<span>{orderType == 0 ? language.e().order.sell : language.e().order.buy}</span>,*/}
                    {/*                                <div>*/}
                    {/*                                    <select className="ui selection dropdown"*/}
                    {/*                                            ref={el => this.amountValue = el}*/}
                    {/*                                            onChange={(e) => {*/}
                    {/*                                                this.amountValue.value = e.target.value;*/}
                    {/*                                            }}>*/}
                    {/*                                        {options}*/}
                    {/*                                    </select>*/}
                    {/*                                </div>*/}
                    {/*                                , [*/}
                    {/*                                    {text: 'Cancel'},*/}
                    {/*                                    {*/}
                    {/*                                        text: 'Ok', onPress: () => {*/}
                    {/*                                            let amount = new BigNumber(this.amountValue.value).multipliedBy(new BigNumber(10).pow(18)).toNumber();*/}
                    {/*                                            if (amount == 0) {*/}
                    {/*                                                Toast.fail("输入金额为0");*/}
                    {/*                                                return;*/}
                    {/*                                            }*/}
                    {/*                                            if (amount > (item.order.value - item.order.dealtValue)) {*/}
                    {/*                                                Toast.fail("超出可交易范围!");*/}
                    {/*                                                return;*/}
                    {/*                                            }*/}
                    {/*                                            //ecode*/}
                    {/*                                            let code = randomByte32();*/}
                    {/*                                            if (orderType == 1) {*/}
                    {/*                                                oAbi.exchangeBuy(this.state.pk, this.state.mainPKr, code, item.id, amount);*/}
                    {/*                                            } else {*/}
                    {/*                                                oAbi.exchangeSell(this.state.pk, this.state.mainPKr, code, item.id, this.state.token, amount);*/}
                    {/*                                            }*/}
                    {/*                                        }*/}
                    {/*                                    },*/}
                    {/*                                ])*/}
                    {/*                        }*/}

                    {/*                    }}>*/}
                    {/*                {orderType == 0 ? language.e().order.sell : language.e().order.buy}*/}
                    {/*            </Button>*/}
                    {/*        </Flex.Item>*/}
                    {/*    </Flex>*/}
                    {/*</div>*/}
                </List.Item>
            )
        });

        return (

            <div>
                <WhiteSpace/>
                <div className="ui small horizontal divided list">
                    {tabList}
                </div>

                {/*<SegmentedControl*/}
                {/*    values={tabList}*/}
                {/*    tintColor={'#868585'}*/}
                {/*    onValueChange={(value)=>{*/}
                {/*        this.setState({token: value});*/}
                {/*        this.init(this.state.mainPKr, value);*/}
                {/*    }}*/}
                {/*    selectedIndex={tabList.indexOf(token)}*/}
                {/*/>*/}

                <List renderHeader={() => '市场挂单'}>
                    {orders.length > 0?showOrders:<List.Item>
                        <div style={{textAlign:'center'}}>
                            <Icon type="iconnodata-topic" style={{width:"100px",height:"100px"}}/>
                        </div>
                    </List.Item>}
                </List>
            </div>
        )
    }
}