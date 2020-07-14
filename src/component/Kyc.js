import React, {Component} from "react";
import oAbi from "./oabi";
import {Modal, WhiteSpace} from "antd-mobile";
import {hash, randomByte32, urlParse} from "./common";
import language from './language'
import * as cookie from "react-cookies";

export default class Kyc extends Component {

    constructor(props, state) {
        super(props);

        let selectedIndex = 0;
        if (document.URL.indexOf("page=business") != -1) {
            selectedIndex = 1;
        }

        this.state = Object.assign({
            pk: this.props.pk,
            code: null,
            pcode: null,
            auditedStatus: 0,
            selectedIndex: selectedIndex
        }, state);
    }

    commitKyc(auditing, code) {
        let self = this;
        if (this.modal) {
            return;
        }
        this.modal = Modal.alert(language.e().kyc.title2,
            <div>
                <div className="ui input"><input type="text" placeholder="nickname"
                                                 onChange={(event) => {
                                                     self.nameValue.value = event.target.value.trim();
                                                 }}
                                                 ref={el => self.nameValue = el}/></div>
                <WhiteSpace/>
                {/*<div className="ui input"><input type="text" value={code}*/}
                {/*                                 onChange={(event) => {*/}
                {/*                                     self.codeValue.value = event.target.value;*/}
                {/*                                 }}*/}
                {/*                                 ref={el => self.codeValue = el}/></div>*/}
                <WhiteSpace/>
            </div>,
            [
                {
                    text: <span>{language.e().modal.cancel}</span>, onPress: () => {
                        window.location.href = document.location.origin + document.location.pathname;
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
                                            window.location.href = document.location.origin + document.location.pathname;
                                        });
                                    });
                                });
                            } else {
                                oAbi.registerKyc(self.state.pk, self.state.mainPKr, name, code2, ecode, "0x", function (res, error) {
                                    window.location.href = document.location.origin + document.location.pathname;
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
                Modal.alert("已提交请稍等", "",
                    [
                        {text: <span>{language.e().modal.cancel}</span>},
                        {
                            text: <span>{language.e().modal.ok}</span>, onPress: () => {
                            }
                        },
                    ])
            } else {
                Modal.alert(language.e().kyc.title1, language.e().kyc.msg1,
                    [
                        {text: <span>{language.e().modal.cancel}</span>},
                        {
                            text: <span>{language.e().modal.ok}</span>, onPress: () => {
                                let host = document.location.origin + document.location.pathname;
                                var urlenc;
                                if (auditing) {
                                    urlenc = encodeURIComponent(host + "/?page=business&code=codeId");
                                } else {
                                    urlenc = encodeURIComponent(host + "/?page=customer&code=codeId");
                                }
                                window.location.href = "https://ahoj.xyz/profile?lang=cn&force=" + this.state.code + "&ref=" + urlenc;
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

    initKyc(name, pk, mainPKr, kycCode) {
        let self = this;
        oAbi.myKyc(pk, mainPKr, function (code, auditedStatus) {
            self.setState({name:name, pk: pk, mainPKr: mainPKr, code: code, auditedStatus: auditedStatus});
            if (self._componentDidMount) {
                self._componentDidMount(mainPKr, code, kycCode);
            }

            if (!code) {
                self.kycTimer = setInterval(function () {
                    oAbi.myKyc(pk, mainPKr, function (code, auditedStatus) {
                        self.setState({code: code, auditedStatus: auditedStatus});
                        if (code) {
                            clearInterval(self.kycTimer);
                        }
                    })
                }, 5 * 1000);
            }
        });
    }

    componentDidMount() {
        let url = document.URL;
        let kycCode;
        let index = url.indexOf("code=");
        if (index != -1) {
            kycCode = url.substring(index + 5).trim();
        }

        let self = this;
        oAbi.init
            .then(() => {
                if (self.state.pk) {
                    oAbi.accountDetails(self.state.pk, function (account) {
                        self.initKyc(account.name, self.state.pk, account.mainPKr, kycCode);
                    });
                } else {
                    oAbi.accountList(function (accounts) {
                        self.initKyc(accounts[0].name, accounts[0].pk, accounts[0].mainPKr, kycCode);
                    });
                }
            });
    }

    componentWillReceiveProps(nextProps) {
        let self = this;
        if (nextProps.pk != this.props.pk) {
            oAbi.accountDetails(nextProps.pk, function (account) {
                oAbi.myKyc(account.pk, account.mainPKr, function (code, auditedStatus) {
                    self.setState({
                        pk: nextProps.pk,
                        mainPKr: account.mainPKr,
                        code: code,
                        auditedStatus: auditedStatus
                    });
                    if (self.init) {
                        self.init(account.mainPKr);
                    }
                })
            });
        }
    }
}

