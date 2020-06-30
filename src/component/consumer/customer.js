import React, {Component} from 'react';
import 'semantic-ui-css/semantic.min.css';
import {MarketOrders} from "./marketorders";
import {MyOrders} from "./myorders";
import BasePage from "../basepage";
import {Tabs} from 'antd-mobile'

const tabs = [
    {title:"买入" , orderType: 1},
    {title:"卖出" , orderType: 0},
    {title:"订单" , orderType: 2},
]

export class CustomerPag extends BasePage {
    constructor(props) {
        super(props, {
            orderType: 1,
        });
    }

    render() {
        return (
            <div>

                <Tabs tabs={tabs}
                      initialPage={0}
                      onChange={(tab, index) => {  this.setState({orderType: tab.orderType}) }}
                      onTabClick={(tab, index) => { this.setState({orderType: tab.orderType}) }}
                >
                    <div>
                        <MarketOrders pk={this.state.pk} orderType={this.state.orderType}/>
                    </div>
                    <div >
                        <MarketOrders pk={this.state.pk} orderType={this.state.orderType}/>
                    </div>
                    <div>
                        <MyOrders pk={this.state.pk}/>
                    </div>
                </Tabs>
            </div>
        )
    }
}