import React, {Component} from 'react';
import 'semantic-ui-css/semantic.min.css';
import {MarketOrders} from "./marketorders";
import {MyOrders} from "./myorders";
import BasePage from "../basepage";
import {Tabs} from 'antd-mobile'

const tabs = [
    {title:"买入" , showType: 1},
    {title:"卖出" , showType: 0},
    {title:"订单" , showType: 2},
]

export class CustomerPag extends BasePage {
    constructor(props) {
        super(props,{showType:1});
    }

    renderContent(showType) {
        if (showType == 2) {
            return <MyOrders pk={this.state.pk}/>;
        } else {
            return <MarketOrders pk={this.state.pk} orderType={showType}/>
        }
    }

    render() {
        return (
            <Tabs tabs={tabs}
                  swipeable={false}
                  initialPage={0}
                  onChange={(tab, index) => { this.setState({showType:tab.showType})}}
                  onTabClick={(tab, index) => {this.setState({showType:tab.showType}) }}
            >
                <div style={{minHeight: document.documentElement.clientHeight}}>
                    {this.renderContent(this.state.showType)}
                </div>

            </Tabs>
        )
    }
}