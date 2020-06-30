import React, {Component} from 'react';
import {Flex, List, Modal, WhiteSpace, WingBlank} from "antd-mobile";
import 'semantic-ui-css/semantic.min.css';
import oAbi from './oabi'

const operation = Modal.operation;

export class AuditingList extends Component {

    constructor(props) {
        super(props);

        let pk = localStorage.getItem("PK");
        if (!pk) {
            oAbi.init
                .then(() => {
                    oAbi.accountList(function (accounts) {
                        localStorage.setItem("PK", accounts[0].pk);
                        localStorage.setItem("MAINPKR", accounts[0].mainPKr);
                        this.state = {
                            pk: accounts[0].pk,
                            mainPKr: accounts[0].mainPKr,
                            codes:[]
                        }
                    });
                })
        } else {
            this.state = {
                pk: localStorage.getItem("PK"),
                mainPKr: localStorage.getItem("MAINPKR"),
                codes:[]
            }
        }
    }

    componentDidMount() {
        let self = this;
        oAbi.init
            .then(() => {
                oAbi.auditingList(self.state.mainPKr, function (codes) {
                    self.setState({codes: codes});
                });
            });
    }

    render() {
        let self = this;
        let list = this.state.codes.map((item, index) => {
            return (
                <List.Item key={index}>
                    <Flex>
                        <Flex.Item style={{flex:3}}><div style={{
                            overflow:'hidden',
                            textOverflow:'ellipsis',
                            whiteSpace: 'nowrap'
                        }}>{item.hcode}</div></Flex.Item>
                        <Flex.Item style={{flex:1,textAlign:'right'}}><a onClick={()=>{

                            Modal.alert("check", <div>
                                <div>{item.hcode}</div>
                                <div>{item.pcode}</div>
                            </div>, [
                                {text: '拒绝', onPress: () => {
                                        oAbi.audited(self.state.pk, self.state.mainPKr, [item.hcode], false);
                                    }},
                                {
                                    text: '通过', onPress: () => {
                                        oAbi.audited(self.state.pk, self.state.mainPKr, [item.hcode], true);
                                    }
                                },
                            ]);

                        }}>check</a>
                                </Flex.Item>
                    </Flex>
                </List.Item>
            )
        });

        return (
            <div style={{border:'1px solid #d4d4d5',paddingTop:'10px'}}>
                <WingBlank>
                    <List renderHeader={() => '审核列表'} className="my-list">
                        {list}
                    </List>
                </WingBlank>
            </div>
           )
    }
}