import React, {Component} from "react";
import oAbi from "./oabi";
import {Modal, WhiteSpace} from "antd-mobile";
import {hash, randomByte32} from "./common";
import language from './language'
import * as cookie from "react-cookies";

const host = "http://localhost:3000";

export default class Basepage extends Component {

    constructor(props, state) {
        super(props);
        this.state = Object.assign(state, {
            pk: this.props.pk,
            code: null,
            pcode: null,
            auditedStatus: 0
        });
    }

    fetchKyc() {
        let self = this;
        self.kycTimer = setInterval(function () {
            oAbi.myKyc(self.state.pk, self.state.mainPKr, function (code, auditedStatus) {
                if (code) {
                    self.setState({code: code, auditedStatus: auditedStatus});
                    clearInterval(self.kycTimer);
                }
            });
        }, 10 * 1000);
    }

    commitKyc(auditing, code) {
        let self = this;
        Modal.alert(language.e().kyc.title2,
            <div>
                <div className="ui input"><input type="text" placeholder="name"
                                                 onChange={(event) => {
                                                     self.nameValue.value = event.target.value;
                                                 }}
                                                 ref={el => self.nameValue = el}/></div>
                <WhiteSpace/>
                <div className="ui input"><input type="text" value={code}
                                                 onChange={(event) => {
                                                     self.codeValue.value = event.target.value;
                                                 }}
                                                 ref={el => self.codeValue = el}/></div>
                <WhiteSpace/>
            </div>,
            [
                {
                    text: <span>{language.e().modal.cancel}</span>, onPress: () => {
                        // window.location.href = host;
                    }
                },
                {
                    text: <span>{language.e().modal.ok}</span>, onPress: () => {
                        let name = self.nameValue.value;
                        let code1 = oAbi.code1(code);
                        let code2 = oAbi.code2(code1);
                        oAbi.pkrCrypto(self.state.pk, self.state.mainPKr, code, function (ecode) {
                            if (auditing) {
                                oAbi.auditor(self.state.mainPKr, function (auditor) {
                                    oAbi.pkrEncrypt(auditor, code1, function (pcode) {
                                        console.log("registerKyc", auditor, code, code2, ecode, pcode);
                                        oAbi.registerKyc(self.state.pk, self.state.mainPKr, name, code2, ecode, pcode, function (res, error) {
                                            if(error) {
                                                // window.location.href = host;
                                            } else {
                                                cookie.save('hasRegister', true, {path: '/', maxAge: 30});
                                                self.fetchKyc();
                                            }
                                        });
                                    });
                                });
                            } else {
                                oAbi.registerKyc(self.state.pk, self.state.mainPKr, name, code2, ecode, "0x", function (res, error) {
                                    if(error) {
                                        // window.location.href = host;
                                    } else {
                                        cookie.save('hasRegister', true, {path: '/', maxAge: 20});
                                        self.fetchKyc();
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
                                var urlenc;
                                if (auditing) {
                                    urlenc = encodeURIComponent("http://localhost:3000/?page=business&code=codeId");
                                } else {
                                    urlenc = encodeURIComponent("http://localhost:3000/?page=customer&code=codeId");
                                }
                                window.location.href = "https://ahoj.xyz/profile?lang=cn&ref=" + urlenc;
                            }
                        },
                    ])
            }

        } else {
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
            clearInterval(this.kycTimer);
        }
    }

    componentDidMount() {
        console.log("componentDidMount", this.props.orderType, this);
        let url = document.URL;
        let code0;
        let index = url.indexOf("code=");
        if (index != -1) {
            code0 = url.substring(index + 5).trim();
        }

        let self = this;
        oAbi.init
            .then(() => {
                oAbi.accountDetails(this.state.pk, function (account) {
                    oAbi.myKyc(account.pk, account.mainPKr, function (code, auditedStatus) {
                        self.setState({mainPKr: account.mainPKr, code: code, auditedStatus: auditedStatus});
                        if (self._componentDidMount) {
                            self._componentDidMount(account.mainPKr, code);
                        }
                        if (!code && code0 && !cookie.load('clear')) {
                            if (url.indexOf("page=business") != -1) {
                                self.commitKyc(true, code0);
                            } else {
                                self.commitKyc(false, code0);
                            }
                        }
                    });
                });
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
                    self.init(account.mainPKr);
                })
            });
        }
    }
}

