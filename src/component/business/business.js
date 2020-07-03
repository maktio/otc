import React, {Component} from 'react';
import 'semantic-ui-css/semantic.min.css';
import {MyOrders} from "./myorders";
import {Placeorder} from "./placeorder";
import BasePage from "../basepage";
import {Tabs} from "antd-mobile";

const tabs = [
    {title:"商家买入" , showType: 0},
    {title:"商家卖出" , showType: 1},
    {title:"商家订单" , showType: 2},
]

export class BusinessPage extends BasePage {
    constructor(props) {
        super(props, {
            sellOrders: [],
            buyOrders: [],
            showType: 0
        });
    }

    renderContent(showType) {
        if (showType == 2) {
            return <MyOrders pk={this.state.pk}/>;
        } else {
            return <Placeorder pk={this.state.pk} orderType={showType}/>
        }
    }

    render() {
        return (
            <div >
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
            </div>)
    }
}