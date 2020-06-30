import axios from 'axios'


class JsonRpc {

    constructor() {
    }

    seroRpc(rpc, _method, _params, callback) {
        let data = {
            id: 0,
            jsonrpc: "2.0",
            method: _method,
            params: _params,
        };
        axios.post(rpc, data).then(function (response) {
            let data = response.data
            if (callback) {
                callback(data);
            }
        }).catch(function (error) {
            console.log("req error: ", error);
        })
    }

    get(url, cb) {
        axios.get(url).then(function (rest) {
            if (cb) {
                cb(rest.data)
            }
        })
    }
}

export {JsonRpc}
