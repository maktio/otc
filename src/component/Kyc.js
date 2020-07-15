import React, {Component} from "react";
import oAbi from "./oabi";
import {Flex, Icon, Modal, WhiteSpace} from "antd-mobile";
import {hash, randomByte32, urlParse} from "./common";
import language from './language'
import * as cookie from "react-cookies";
import Iframe from "react-iframe";

export default class Kyc extends Component {

    constructor(props, state) {
        super(props);

        this.state = Object.assign({
            pk: this.props.pk,
            code: null,
            pcode: null,
            info:{},
            auditedStatus: 0,
            selectedIndex: 0,
            modal:true
        }, state);
    }

    startKycTimer(pk, mainPKr) {
        let self = this;
        if (!self.kycTimer) {
            self.kycTimer = setInterval(function () {
                oAbi.myKyc(pk, mainPKr, function (code, auditedStatus, info) {
                    if (code) {
                        self.setState({code: code, auditedStatus: auditedStatus, info: info});
                        clearInterval(self.kycTimer);
                    }
                })
            }, 10 * 1000);
        }
    }

    commitKyc(auditing, code) {
        let self = this;
        if (this.modal) {
            return;
        }
        this.modal = Modal.alert(language.e().kyc.title2,
            <div>
                <div className="ui input" style={{width:'80%'}}><input type="text" placeholder="nickname"
                                                 onChange={(event) => {
                                                     self.nameValue.value = event.target.value.trim();
                                                 }}
                                                 ref={el => self.nameValue = el}/></div>
            </div>,
            [
                {
                    text: <span>{language.e().modal.cancel}</span>, onPress: () => {
                    }
                },
                {
                    text: <span>{language.e().modal.ok}</span>, onPress: () => {
                        self.modal = null;
                        let name = self.nameValue.value;
                        if(name.length < 3 || name.length > 32) {
                            Modal.alert('', 'nickname长度3~32个字符',);
                            return;
                        }
                        let code1 = oAbi.code1(code);
                        let code2 = oAbi.code2(code1);
                        oAbi.pkrCrypto(self.state.pk, self.state.mainPKr, code, function (ecode, err) {
                            if (err) {
                                Modal.alert('', '不支持老账户',);
                                return;
                            }
                            if (auditing) {
                                oAbi.auditor(self.state.mainPKr, function (auditor) {
                                    if(!auditor) {
                                        Modal.alert('', '未设置审核员，请联系客服',);
                                        return;
                                    }
                                    oAbi.pkrEncrypt(auditor, code1, function (pcode, err) {
                                        if (err) {
                                            Modal.alert('', '不支持老账户',);
                                            return;
                                        }
                                        oAbi.registerKyc(self.state.pk, self.state.mainPKr, name, code2, ecode, pcode, function (res, error) {
                                            if(!error) {
                                                self.startKycTimer(self.state.pk, self.state.mainPKr);
                                            }
                                        });
                                    });
                                });
                            } else {
                                oAbi.registerKyc(self.state.pk, self.state.mainPKr, name, code2, ecode, "0x", function (res, error) {
                                    if(!error) {
                                        self.startKycTimer(self.state.pk, self.state.mainPKr);
                                    }
                                });
                            }
                        });
                    }
                },
            ])
    }

    kyc(auditing) {
        let self = this;
        if (!this.state.code) {
            if (cookie.load('hasRegister')) {
                Modal.alert("已提交请稍等", "",)
            } else {
                Modal.alert(language.e().kyc.title1, language.e().kyc.msg1,
                    [
                        {text: <span>{language.e().modal.cancel}</span>},
                        {
                            text: <span>{language.e().modal.ok}</span>, onPress: () => {
                                let url = "https://ahoj.xyz/login?lang=cn&force=" + this.state.code
                                let kyc = Modal.alert(<div style={{textAlign:'right'}}>
                                    <span style={{}} onClick={() => {
                                        kyc.close();
                                    }
                                    }><Icon type={"cross"}/></span>
                                </div>, <div style={{witdh: "40%"}}>
                                    <iframe src={url}
                                            width="100%"
                                            height={document.documentElement.clientHeight * 0.7}
                                            display="initial"
                                            position="relative"
                                            frameBorder="no"
                                    />
                                </div>, []);
                                window.addEventListener("message", function (msg) {
                                    if (msg.origin == "https://ahoj.xyz" && msg.data && msg.data.code0) {
                                        self.commitKyc(self.state.selectedIndex == 1, msg.data.code0);
                                        kyc.close();
                                    }
                                }, {passive: true});
                            }
                        },
                    ])
            }

        } else if (auditing) {
            if (this.state.auditedStatus == 0) {
                Modal.alert(language.e().kyc.title3, language.e().kyc.msg3,
                    [
                        {text: <span>{language.e().modal.cancel}</span>},
                        {
                            text: <span>{language.e().modal.ok}</span>, onPress: () => {
                                oAbi.auditor(self.state.mainPKr, function (auditor) {
                                    oAbi.pkrEncrypt(auditor, oAbi.code1(self.state.code), function (pcode) {
                                        oAbi.needAuditing(self.state.pk, self.state.mainPKr, pcode);
                                    });
                                });
                            }
                        },
                    ])
            } else {
                Modal.alert('', language.e().kyc.title4)
            }
        }
    }


    componentWillUnmount() {
        if (this.timer) {
            clearInterval(this.timer);
        }
        if (this.kycTimer) {
            clearInterval(this.timer);
        }
    }

    initKyc(account) {
        let self = this;
        oAbi.myKyc(account.pk, account.mainPKr, function (code, auditedStatus, info) {
            self.setState({
                name: account.name,
                pk: account.pk,
                mainPKr: account.mainPKr,
                balances: account.balances,
                code: code,
                auditedStatus: auditedStatus,
                info: info
            });
            if (self._componentDidMount) {
                self._componentDidMount(account, code);
            }
        });
    }

    componentDidMount() {
        let self = this;
        oAbi.init
            .then(() => {
                if (self.state.pk) {
                    oAbi.accountDetails(self.state.pk, function (account) {
                        self.initKyc(account);
                    });
                } else {
                    oAbi.accountList(function (accounts) {
                        self.initKyc(accounts[0]);
                    });
                }
            });
    }

    componentWillReceiveProps(nextProps) {
        let self = this;
        if(this.kycTimer) {
            clearInterval(this.kycTimer);
        }
        if (nextProps.pk != this.props.pk) {
            oAbi.accountDetails(nextProps.pk, function (account) {
                oAbi.myKyc(account.pk, account.mainPKr, function (code, auditedStatus) {
                    self.setState({
                        pk: account.pk,
                        mainPKr: account.mainPKr,
                        code: code,
                        auditedStatus: auditedStatus
                    });

                    if(!code) {
                        self.startKycTimer(account.pk, account.mainPKr)
                    }

                    if (self._init) {
                        self._init(account.mainPKr);
                    }
                })
            });
        }
    }
}

