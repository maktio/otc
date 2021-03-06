import React, {Component} from 'react';
import {WingBlank, SegmentedControl, NavBar, Icon, Tabs, Modal, WhiteSpace, Flex} from "antd-mobile";
import './App.css';
import 'semantic-ui-css/semantic.min.css';
import oAbi from './component/oabi'
import {showPK} from "./component/common";
import {AuditingList} from "./component/auditing";
import {COrders} from "./component/consumer/corders";
import {MarketOrders} from "./component/consumer/marketorders";
import {PlaceOrder} from "./component/business/placeorder";
import {BOrders} from "./component/business/borders";
import Kyc from "./component/Kyc";

const operation = Modal.operation;

const tabs0 = [
    {title: "买入", showType: 0},
    {title: "卖出", showType: 1},
    {title: "订单", showType: 2},
];

const tabs1 = [
    {title: "商家买入", showType: 0},
    {title: "商家卖出", showType: 1},
    {title: "商家订单", showType: 2},
];

class App extends Kyc {

    constructor(props) {
        super(props, {
            name: localStorage.getItem("NAME"),
            pk: localStorage.getItem("PK"),
            mainPKr: localStorage.getItem("MAINPKR"),
            showType: 0,
            origin: true,
            selectedIndex: 0,
        });
    }

    _componentDidMount(account) {
        this.init(account);
    }

    init(account) {
        let self = this;
        oAbi.roleType(account.mainPKr, function (roleType) {
            oAbi.myKyc(account.pk, account.mainPKr, function (code, auditedStatus, info) {
                if (!code) {
                    self.startKycTimer(account.pk, account.mainPKr);
                }
                self.setState({
                    pk: account.pk,
                    name: account.name,
                    mainPKr: account.mainPKr,
                    roleType: roleType,
                    code: code,
                    auditedStatus: auditedStatus,
                    info: info
                });
            });
        });
    }

    changAccount() {
        let self = this;
        oAbi.init
            .then(() => {
                oAbi.accountList(function (accounts) {
                    let actions = [];
                    accounts.forEach(function (account, index) {
                        actions.push(
                            {
                                text: <span>{account.name + ":" + showPK(account.mainPKr)}</span>, onPress: () => {
                                    if (self.kycTimer) {
                                        clearInterval(self.kycTimer);
                                    }
                                    self.init(account);
                                    localStorage.setItem("NAME", account.name);
                                    localStorage.setItem("PK", account.pk);
                                    localStorage.setItem("MAINPKR", account.mainPKr);
                                }
                            }
                        );
                    });
                    operation(actions);
                });
            })
    }

    renderContent(showType) {
        if (this.state.selectedIndex == 0) {
            if (showType == 2) {
                return <COrders pk={this.state.pk}/>;
            } else {
                return <MarketOrders pk={this.state.pk} orderType={showType}/>
            }
        } else {
            if (showType == 2) {
                return <BOrders pk={this.state.pk}/>;
            } else {
                return <PlaceOrder pk={this.state.pk} orderType={showType}/>
            }
        }
    }

    render() {
        let kycStatus = "未KYC";
        if (this.state.code) {
            if (this.state.selectedIndex) {
                if (this.state.auditedStatus == 0) {
                    kycStatus = "未审核"
                } else if (this.state.auditedStatus == 1) {
                    kycStatus = "审核中"
                } else {
                    kycStatus = this.state.info.name;
                }
            } else {
                kycStatus = this.state.info.name;
            }
        }

        return (
            <div>
                <WingBlank>
                    <Flex>
                        <Flex.Item>
                             <span key={"0"} style={{fontSize: '12px'}} onClick={() => {
                                 if (this.state.auditedStatus < 1) {
                                     this.kyc(this.state.selectedIndex == 1);
                                 }
                             }}>{kycStatus}</span>
                        </Flex.Item>
                        <Flex.Item style={{textAlign: 'right'}}>
                            <span key="2" onClick={this.changAccount.bind(this)}>{this.state.name}<Icon key="1"
                                                                                                        type="iconaccount"
                                                                                                        className="text-black"/></span>
                        </Flex.Item>
                    </Flex>
                    <WhiteSpace/>
                    <img src={require('./makt-banner.png')} width='100%' height='auto'/>
                </WingBlank>

                <WhiteSpace/>
                <NavBar
                    mode="light"
                    // leftContent={[

                    // ]}
                    // rightContent={[
                    //     <span key="2" onClick={this.changAccount.bind(this)}>{this.state.name}<Icon key="1" type="iconaccount" className="text-black" /></span>
                    // ]}
                >
                    <SegmentedControl
                        values={['个人', '商家']}
                        tintColor={'#000'}
                        style={{width: '150px'}}
                        selectedIndex={this.state.selectedIndex}
                        onValueChange={() => {
                            this.setState({origin: false, selectedIndex: (this.state.selectedIndex + 1) % 2})
                        }}
                    />
                </NavBar>

                <WingBlank>


                    <div>
                        {
                            this.state.selectedIndex == 0 ?
                                <Tabs tabs={tabs0}
                                      swipeable={false}
                                      initialPage={0}
                                      onChange={(tab, index) => {
                                          this.setState({showType: tab.showType})
                                      }}
                                >
                                </Tabs> :
                                <Tabs tabs={tabs1}
                                      swipeable={false}
                                      initialPage={0}
                                      onChange={(tab, index) => {
                                          this.setState({showType: tab.showType})
                                      }}
                                >
                                </Tabs>
                        }
                        {
                            this.renderContent(this.state.showType)
                        }

                    </div>
                    <WhiteSpace/>
                    {
                        this.state.roleType > 0 && <AuditingList roleType={this.state.roleType} pk={this.state.pk}/>
                    }
                </WingBlank>
            </div>
        )
    }
}

export default App;