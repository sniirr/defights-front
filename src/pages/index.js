import React from 'react'
import {Switch, Route} from "react-router-dom"
import LandingPage from "./LandingPage";
import PoolsPage from "./PoolsPage";
import BridgePage from "./BridgePage";
import Dashboard from "./Dashboard";
// import NFTsPage from "./NFTsPage";
import StoryPage from "./StoryPage";
import FAQPage from "./FAQPage";

const Pages = () => (
    <Switch>
        <Route exact path="/">
            <LandingPage/>
        </Route>
        <Route path="/dashboard">
            <Dashboard/>
        </Route>
        <Route path="/pools">
            <PoolsPage/>
        </Route>
        <Route path="/bridge">
            <BridgePage/>
        </Route>
        {/*<Route path="/nfts">*/}
        {/*    <NFTsPage/>*/}
        {/*</Route>*/}
        <Route path="/story">
            <StoryPage/>
        </Route>
        <Route path="/faq">
            <FAQPage/>
        </Route>
    </Switch>
)

export default Pages
