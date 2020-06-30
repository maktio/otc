import React, {Component} from "react";
import oAbi from "./oabi";
import {Modal, WhiteSpace} from "antd-mobile";
import {randomByte32} from "./common";
import language from './language'


export default class Basepage extends Component {

    constructor(props, state) {
        super(props);
        this.state = Object.assign(state, {
            pk: this.props.pk,
            ecode: null,
            pcode: null,
            hasAudited: false
        });
    }


    kyc(auditing) {
        let self = this;
        console.log("kyc", this.state.pcode);
        if (!this.state.ecode) {
            Modal.alert(language.e().kyc.title1, language.e().kyc.msg1,
                [
                    {text: <span>{language.e().modal.cancel}</span>},
                    {
                        text: <span>{language.e().modal.ok}</span>, onPress: () => {
                            Modal.alert(language.e().kyc.title2,
                                <div>
                                    <div className="ui input"><input type="text" placeholder="name"
                                                                     onChange={(event) => {
                                                                         self.nameValue.value = event.target.value;
                                                                     }}
                                                                     ref={el => self.nameValue = el}/></div>
                                    <WhiteSpace/>
                                    <div className="ui input"><input type="text" value={randomByte32()}
                                                                     ref={el => self.ecodeValue = el} onChange={() => {
                                    }}/></div>
                                    <WhiteSpace/>
                                </div>,
                                [
                                    {text: <span>{language.e().modal.cancel}</span>},
                                    {
                                        text: <span>{language.e().modal.ok}</span>, onPress: () => {
                                            let name = self.nameValue.value;
                                            let ecode = self.ecodeValue.value;

                                            let hcode = "0x" + Buffer.from(ecode.substring(2), 'hex').toString('hex');

                                            if (auditing) {
                                                let pcode = "0x" + Buffer.from(ecode.substring(2), 'hex').toString('hex');
                                                oAbi.registerKyc(self.state.pk, self.state.mainPKr, name, ecode, hcode, pcode);
                                            } else {
                                                oAbi.registerKyc(self.state.pk, self.state.mainPKr, name, ecode, hcode, "0x0000000000000000000000000000000000000000000000000000000000000000");
                                            }
                                            self.kycTimer = setInterval(function () {
                                                oAbi.myKyc(self.state.mainPKr, function (ecode, hasAudited) {
                                                    if (ecode) {
                                                        self.setState({ecode: ecode, hasAudited: hasAudited});
                                                        clearInterval(self.kycTimer);
                                                    }
                                                });
                                            }, 10 * 1000);
                                        }
                                    },
                                ])
                        }
                    },
                ])
        } else {
            if (!this.state.pcode) {
                Modal.alert(language.e().kyc.title3, language.e().kyc.msg3,
                    [
                        {text: <span>{language.e().modal.cancel}</span>},
                        {
                            text: <span>{language.e().modal.ok}</span>, onPress: () => {
                                let pcode = randomByte32();
                                oAbi.needAuditing(self.state.pk, self.state.mainPKr, pcode);
                                // self.kycTimer = setInterval(function () {
                                //     oAbi.myKyc(self.state.mainPKr, function (ecode, hasAudited) {
                                //         if (hasAudited) {
                                //             self.setState({ecode: ecode, hasAudited: hasAudited});
                                //             clearInterval(self.kycTimer);
                                //         }
                                //     });
                                // }, 10 * 1000);
                            }
                        },
                    ])
            } else {
                Modal.alert(language.e().kyc.title4, "",
                    [
                        {text: <span>{language.e().modal.cancel}</span>},
                        {
                            text: <span>{language.e().modal.ok}</span>, onPress: () => {
                            }
                        },
                    ])
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
        let self = this;
        oAbi.init
            .then(() => {
                oAbi.accountDetails(this.state.pk, function (account) {
                    oAbi.myKyc(account.mainPKr, function (ecode, pcode, hasAudited) {
                        self.setState({mainPKr: account.mainPKr, ecode: ecode, pcode: pcode, hasAudited: hasAudited});
                        if (self._componentDidMount) {
                            self._componentDidMount(account.mainPKr);
                        }
                    });
                });
            });
    }

    componentWillReceiveProps(nextProps) {
        let self = this;
        if (nextProps.pk != this.props.pk) {
            oAbi.accountDetails(nextProps.pk, function (account) {
                oAbi.myKyc(account.mainPKr, function (ecode) {
                    self.setState({pk: nextProps.pk, mainPKr: account.mainPKr, ecode: ecode});
                    if (self.init) {
                        self.init(account.mainPKr);
                    }
                })
            });
        }
    }

}

