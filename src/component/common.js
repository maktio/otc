import BigNumber from "bignumber.js";

const keccak256 = require("keccak256");
const zeros = "000000000000000000";

export function randomByte32() {
    let hex = "0x";
    for (var i = 0; i < 8; i++) {
        hex += Math.random().toString(16).slice(-8)
    }
    return hex;
    // return Buffer.from(hex, "hex");
}

function getDate(num) {
    if (num < 10) {
        return "0" + num;
    } else {
        return num;
    }
}

export function formatDate(time) {
    const Y = time.getFullYear();
    const M = getDate(time.getMonth() + 1);
    const d = getDate(time.getDate());
    const h = getDate(time.getHours());
    const m = getDate(time.getMinutes());
    // var s =getDate(time.getSeconds());
    return `${Y}/${M}/${d} ${h}:${m}`;

}

export function hash(data) {
    return "0x" + Buffer.from(keccak256(data)).toString('hex')
}

export function showToken(token) {
    if (token.length > 15) {
        return token.slice(0, 10) + "..." + token.slice(-5)
    } else {
        return token
    }
}

export function bytes32ToToken(data) {
    let bytes = Buffer.from(data.substring(2), "hex");
    return String.fromCharCode.apply(String, bytes).trim();
}

export function showPrice(price) {
    if (price) {
        let ret = new BigNumber(price).dividedBy(new BigNumber(1e18)).toFixed(18);
        return trimNumber(ret, 18);
    } else {
        return "0.000";
    }
}

export function showValueP(val, decimal, decimalPlaces) {
    let num = new BigNumber(val).dividedBy(new BigNumber(10).pow(decimal));
    if (num.comparedTo(1000000) >= 0) {
        let text = num.dividedBy(1000000).toFixed(2);
        return trimNumber(text, 2) + "M";
    } else if (num.comparedTo(1000) >= 0) {
        let text = num.dividedBy(1000).toFixed(2);
        return trimNumber(text, 2) + "K";
    } else {
        return trimNumber(num.toFixed(decimalPlaces), decimalPlaces);
    }

}

export function showValue(val, decimal, decimalPlaces) {
    let text = new BigNumber(val).dividedBy(new BigNumber(10).pow(decimal)).toFixed(decimalPlaces);
    return trimNumber(text, decimalPlaces)
}

export function showPK(pk, len) {
    if (!pk) {
        return "";
    }
    if (!len) {
        len = 8;
    }
    return pk.slice(0, len) + "..." + pk.slice(-len)
}

export function tokenToBytes(token) {
    let bytes = Buffer.alloc(32);
    bytes.fill(token, 0, token.length);
    return "0x" + bytes.toString('hex');
}

function trimNumber(numberStr, decimalPlaces) {
    let vals = numberStr.split(".")
    if (vals.length < 2) {
        return numberStr;
    } else {
        let index = -1;
        let decimal = vals[1];
        for (let i = decimal.length - 1; i >= 0; i--) {
            if (decimal.charAt(i) != '0') {
                index = i;
                break;
            }
        }
        decimal = decimal.substring(0, index + 1);
        let numStr = vals[0];
        if (decimal.length > decimalPlaces) {
            decimal = decimal.substring(0, decimalPlaces);
        }
        if (decimal.length > 0) {
            numStr += "." + decimal;
        }
        return numStr
    }
}


export function urlParse() {
    let url = document.URL;
    let obj = {}
    let reg = /[?&][^?&]+=[^?&]+/g
    let arr = url.match(reg)
    if (arr) {
        arr.forEach((item) => {
            let tempArr = item.substr(1).split('=')
            let key = decodeURIComponent(tempArr[0])
            let val = decodeURIComponent(tempArr[1])
            obj[key] = val
        })
    }
    return obj
}