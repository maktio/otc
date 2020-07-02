import React, {Component} from 'react';
import 'semantic-ui-css/semantic.min.css';
import {MyOrders} from "./myorders";
import {Placeorder} from "./placeorder";
import BasePage from "../basepage";
import {MarketOrders} from "../consumer/marketorders";
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
        });
    }

    render() {
        return (
            <div>
                <Tabs tabs={tabs}
                      initialPage={0}
                      onChange={(tab, index) => {}}
                      onTabClick={(tab, index) => {}}

                >
                    <div style={{    overflowX: 'hidden',borderBottom:""}}>
                        <Placeorder pk={this.state.pk} orderType={0}/>
                    </div>
                    <div style={{    overflowX: 'hidden'}}>
                        <Placeorder pk={this.state.pk} orderType={1}/>
                    </div>
                    <div style={{    overflowX: 'hidden'}}>
                        <MyOrders pk={this.state.pk}/>
                    </div>
                </Tabs>

                {/*<div className="ui top attached tabular menu">*/}
                {/*    <a className={this.state.showType == 0 ? "active item" : "item"} onClick={() => {*/}
                {/*        this.setState({showType: 0});*/}
                {/*    }}>商家买入</a>*/}
                {/*    <a className={this.state.showType == 1 ? "active item" : "item"} onClick={() => {*/}
                {/*        this.setState({showType: 1});*/}
                {/*    }}>商家卖出</a>*/}
                {/*    <a className={this.state.showType == 2 ? "active item" : "item"} onClick={() => {*/}
                {/*        this.setState({showType: 2});*/}
                {/*    }}>商家订单</a>*/}
                {/*</div>*/}
                {/*{*/}
                {/*    this.state.showType < 2 ? <Placeorder pk={this.state.pk} orderType={this.state.showType}/> :*/}
                {/*        <MyOrders pk={this.state.pk}/>*/}
                {/*}*/}
            </div>)
            // <StickyContainer>
            //     <Sticky>
            //         {({style, isSticky, wasSticky, distanceFromTop, distanceFromBottom, calculatedHeights}) => (
            //             <div style={{
            //                 ...style,
            //                 zIndex: 3,
            //                 color: 'white',
            //                 backgroundColor: '#fff'
            //             }}>
            //                 <div className="ui top attached tabular menu">
            //                     <a className={this.state.showType == 0 ? "active item" : "item"} onClick={() => {
            //                         this.setState({showType: 0});
            //                     }}>商家买入</a>
            //                     <a className={this.state.showType == 1 ? "active item" : "item"} onClick={() => {
            //                         this.setState({showType: 1});
            //                     }}>商家卖出</a>
            //                     <a className={this.state.showType == 2 ? "active item" : "item"} onClick={() => {
            //                         this.setState({showType: 2});
            //                     }}>商家订单</a>
            //                     <a className={this.state.showType == 3 ? "active item" : "item"} onClick={() => {
            //                         this.setState({showType: 3});
            //                     }}>资产</a>
            //                 </div>
            //             </div>
            //         )}
            //     </Sticky>
            //     {
            //         this.state.showType < 2 ? <PlaceOrder pk={this.state.pk} orderType={this.state.showType}/> :
            //             (this.state.showType == 2 ? <MyOrders pk={this.state.pk}/> : <Assets pk={this.state.pk}/>)
            //     }
            //
            // </StickyContainer>);
    }
}