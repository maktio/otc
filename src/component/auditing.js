import React, {Component} from 'react';
import {Flex, List, Modal, WhiteSpace, WingBlank} from "antd-mobile";
import 'semantic-ui-css/semantic.min.css';
import oAbi from './oabi'
import {hash} from "./common";
import Iframe from "react-iframe";

export class AuditingList extends Component {

    constructor(props) {
        super(props);

        this.state = {
            pk: localStorage.getItem("PK"),
            mainPKr: localStorage.getItem("MAINPKR"),
            codes: []
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
                                    let url = "https://ahoj.xyz/level/code1/" + code1 + "?lang=cn";
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

        return (
            <div style={{border: '1px solid #d4d4d5', paddingTop: '10px'}}>
                <div ref={el => this.modal = el}>{this.state.modal}</div>
                <WingBlank>
                    <List renderHeader={() => '审核列表'} className="my-list">
                        {list}
                    </List>
                </WingBlank>
            </div>
        )
    }
}