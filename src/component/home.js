import React, {Component} from 'react';
import {Flex, Modal, WhiteSpace, WingBlank,SegmentedControl,NavBar,Icon} from "antd-mobile";
import 'semantic-ui-css/semantic.min.css';
import oAbi from './oabi'
import {showPK} from "./common";
import {BusinessPage} from "./business/business";
import {CustomerPag} from "./consumer/customer";
import {AuditingList} from "./auditing";
import language from './language'

const operation = Modal.operation;

export class Otc extends Component {

    constructor(props) {
        super(props);
        this.state = {
            name:localStorage.getItem("NAME"),
            pk: localStorage.getItem("PK"),
            mainPKr: localStorage.getItem("MAINPKR"),
            showType: true,
            isOwner:false
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
                        self.setState({pk: pk, mainPKr: mainPKr,name:name, isOwner: mainPKr == owner});
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

    render() {
        return (
            <div>
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
                        style={{ width: '150px' }}
                        onValueChange={()=>{this.setState({showType: !this.state.showType})}}
                    />
                </NavBar>

                <WhiteSpace/>
                <WingBlank>
                    <div>
                        {this.state.showType ? <CustomerPag pk={this.state.pk}/> : <BusinessPage pk={this.state.pk}/>}
                    </div>
                    <WhiteSpace/>
                    {
                        this.state.isOwner && <AuditingList/>
                    }
                </WingBlank>
            </div>
        )

    }
}