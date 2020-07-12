import React, {Component} from 'react';
import {WingBlank, SegmentedControl, NavBar, Icon, Tabs, Modal, WhiteSpace} from "antd-mobile";
import './App.css';
import 'semantic-ui-css/semantic.min.css';
import oAbi from './component/oabi'
import {showPK} from "./component/common";
import {AuditingList} from "./component/auditing";
import {COrders} from "./component/consumer/corders";
import {MarketOrders} from "./component/consumer/marketorders";
import {PlaceOrder} from "./component/business/placeorder";
import {BOrders} from "./component/business/borders";

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

class App extends Component {

    constructor(props) {
        super(props);
        let selectedIndex = 0;
        if (document.URL.indexOf("page=business") != -1) {
            selectedIndex = 1;
        }
        this.state = {
            name: localStorage.getItem("NAME"),
            pk: localStorage.getItem("PK"),
            mainPKr: localStorage.getItem("MAINPKR"),
            selectedIndex: selectedIndex,
            showType: 0,
            isOwner: false,
            origin:true
        }
    }

    componentDidMount() {
        let self = this;

        oAbi.init
            .then(() => {
                let pk = localStorage.getItem("PK");
                if (!pk) {
                    oAbi.accountList(function (accounts) {
                        localStorage.setItem("PK", accounts[0].pk);
                        localStorage.setItem("MAINPKR", accounts[0].mainPKr);
                        localStorage.setItem("NAME", accounts[0].name);
                        oAbi.auditor(accounts[0].pk, function (owner) {
                            self.setState({
                                pk: accounts[0].pk,
                                mainPKr: accounts[0].mainPKr,
                                isOwner: accounts[0].mainPKr == owner
                            });
                        });
                    });
                } else {
                    let mainPKr = localStorage.getItem("MAINPKR");
                    let name = localStorage.getItem("NAME");
                    oAbi.auditor(mainPKr, function (owner) {
                        self.setState({pk: pk, mainPKr: mainPKr, name: name, isOwner: mainPKr == owner});
                    });
                }
            })
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
                                text: <span>{account.name + ":" + showPK(account.pk)}</span>, onPress: () => {
                                    oAbi.auditor(account.mainPKr, function (owner) {
                                        self.setState({isOwner: account.mainPKr == owner});
                                    });
                                    self.setState({
                                        pk: account.pk,
                                        name: account.name,
                                        mainPKr: account.mainPKr,

                                    });
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
        return (
            <WingBlank>
                <NavBar
                    mode="light"
                    rightContent={[
                        <span key="2">{this.state.name}</span>,
                        <Icon key="1" type="iconaccount" className="text-black" onClick={this.changAccount.bind(this)}/>
                    ]}
                >
                    <SegmentedControl
                        values={['个人', '商家']}
                        tintColor={'#000'}
                        style={{width: '150px'}}
                        selectedIndex={this.state.selectedIndex}
                        onValueChange={() => {
                            this.setState({origin:false, selectedIndex: (this.state.selectedIndex + 1) % 2})
                        }}
                    />
                </NavBar>

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
                    this.state.isOwner && <AuditingList/>
                }
            </WingBlank>
        )
    }
}

export default App;