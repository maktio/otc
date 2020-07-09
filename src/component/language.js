const list = ["zh_CN", "en_US", "be_BY", "ja_JP", "ko_KR"];

class Language {

    set = (_lang) => {
        if (list.indexOf(_lang) > -1) {
            localStorage.setItem("language", _lang)
        } else {
            localStorage.setItem("language", "en_US")
        }
    }

    e = () => {
        const lang = localStorage.getItem("language");
        if (lang === "zh_CN") {
            return this.zh_CN;
        } else if (lang === "en_US") {
            return this.en_US;
        } else if (lang === "be_BY") {
            return this.be_BY;
        } else if (lang === "ja_JP") {
            return this.ja_JP;
        } else if (lang === "ko_KR") {
            return this.ko_KR;
        } else {
            let localUtc = new Date().getTimezoneOffset() / 60;
            if (localUtc === -8) {
                return this.zh_CN;
            } else {
                return this.en_US;
            }
        }
    }

    zh_CN = {
        text: "语言",
        change: "切换",
        modal: {
            ok: "确定",
            cancel: "取消",
        },
        button: {
            ok: "确定",
            cancel: "取消",
        },
        kyc: {
            title1: "未完成KYC信息，请完成",
            msg1: "点确定继续",
            title2: "设置昵称",
            title3: "未提交审核",
            msg3: "点击确定提交审核",
            title4: "等待审核通过"
        },
        order:{

            buy:"买入",
            sell:"卖出",
            time:"时间",
            price:"价格",
            amount:"数量",
            dealAmount:"成交量",
            orderType:"交易类型",
            op:"操作",
            cancel:"撤消订单",
            confirm:"确认",
            refuse:"拒绝",
            pass:"放行",
            tips1:"待确认",
            tips2_0:"待付款",
            tips2_1:"应收",
            tips2_3:"请确认已收款！",
            tips2_4:"超时未收到付款",
            tips3:"已拒绝",
            tips4:"已取消",
            tips5:"已完成",
            tips6:"点确定继续",
            tips7:"撤消订单",
            tips8:"商家信息",
            tips9:"超时放行后请自行放行",
            tips10:"请确认已支付",
            tips11:"请确认已支付",
            tips12:"请确认已收到",
        }
    };

    en_US = {
        text: "语言",
        change: "切换",
        modal: {
            ok: "确定",
            cancel: "取消",
        },
        kyc: {
            title1: "未完成KYC信息，请完成",
            msg1: "点确定继续",
            title2: "设置昵称",
            title3: "未提交审核",
            msg3: "点击确定提交审核",
            title4: "等待审核通过"
        },
        order:{

            buy:"买入",
            sell:"卖出",
            time:"时间",
            price:"价格",
            amount:"数量",
            dealAmount:"成交量",
            orderType:"交易类型",
            op:"操作",
            cancel:"撤消订单",
            confirm:"确认",
            refuse:"拒绝",
            pass:"放行",
            tips1:"待确认,请联系商家确认订单",
            tips2_0:"待付款",
            tips2_1:"应收",
            tips2_3:"请确认已收款！",
            tips2_4:"超时未收到付款",
            tips3:"已拒绝",
            tips4:"已取消",
            tips5:"已完成",
            tips6:"点确定继续",
            tips7:"撤消订单",
            tips8:"商家信息",
            tips9:"超时放行后请自行放行",
            tips10:"请确认已支付",
            tips11:"请确认已支付",
            tips12:"请确认已收到",
        }

    };


    be_BY = {
        text: "языка",
        modal: {
            ok: "OK",
            cancel: "Отмена"
        },
        tabBar: {
            price: "рынки",
            trade: "торговать",
            assets: "активы"
        },
        home: {
            account: "учетная запись",
            change: "изменить",
            name: "имя",
            trade: "торговать",
            lastPrice: "Последняя цена",
        },
        trade: {
            buy: "купить",
            sell: "продавать",
            orderPrice: "Цена",
            orderNum: "сумма",
            available: "доступный",
            amount: "сумма",

            price: "Цена",
            num: "сумма",

            openOrders: "Открытые заказы",
            all: "все",
            cancel: "Отмена",
            cancelAll: "Отменить все",

            finished: "Завершенный",
            canceled: "отменен",
            total: "общее количество",
            volume: "объем",
            depth: "depth map",
        },

        assets: {
            total: "Итоговый баланс",
            available: "Доступный",
            locked: "в заказах",
            rechange: "перезарядка",
            withdrawal: "Сумма вывода",
            trade: "торговать",
            num: "количество"
        }
    };

    ja_JP = {
        text: "言語",
        modal: {
            ok: "OK",
            cancel: "キャンセル"
        },
        tabBar: {
            price: "市場",
            trade: "トレード",
            assets: "資産"
        },
        home: {
            account: "アカウント",
            change: "変化する",
            name: "名前",
            trade: "トレード",
            lastPrice: "最後価格",
        },
        trade: {
            buy: "購入",
            sell: "売る",
            orderPrice: "価格",
            orderNum: "量",
            available: "利用可能",
            amount: "量",

            price: "価格",
            num: "量",

            openOrders: "未処理の注文",
            all: "すべて",
            cancel: "キャンセル",
            cancelAll: "すべてキャンセル",

            finished: "完成した",
            canceled: "キャンセル",
            total: "合計",
            volume: "ボリューム",
            depth: "depth map",
        },

        assets: {
            total: "合計",
            available: "利用可能",
            locked: "順番に",
            rechange: "保証金",
            withdrawal: "撤回",
            trade: "トレード",
            num: "量"
        }
    };

    ko_KR = {
        text: "언어",
        modal: {
            ok: "OK",
            cancel: "취소"
        },
        tabBar: {
            price: "시장",
            trade: "무역",
            assets: "자산"
        },
        home: {
            account: "계정",
            change: "변화",
            name: "이름",
            trade: "무역",
            lastPrice: "마지막 가격",
        },
        trade: {
            buy: "구입",
            sell: "팔다",
            orderPrice: "가격",
            orderNum: "양",
            available: "이용할 수 있는",
            amount: "양",

            price: "가격",
            num: "양",

            openOrders: "주문 열기",
            all: "모두",
            cancel: "취소",
            cancelAll: "모두 취소",

            finished: "완성됨",
            canceled: "취소 된",
            total: "합계",
            volume: "음량",
            depth: "depth map",
        },

        assets: {
            total: "합계",
            available: "사용 가능한 잔액",
            locked: "순서대로",
            rechange: "재충전",
            withdrawal: "철수",
            trade: "무역",
            num: "양"
        }
    };
};

const language = new Language();
export default language