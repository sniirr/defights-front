import React from 'react'
import './BridgePage.scss'
import {Bridge} from "shared/dapp-bridge";

const BridgePage = () => {
    return (
        <div className="page bridge-page">
            <div className="page-inner">
                <div className="side-by-side">
                    <div className="info">
                        <h1>DAPP Token Bridge</h1>
                        <p>The DAPP token bridge is powered by DAPP Network’s universal bridging technology.</p>
                        <div className="center-aligned-row">
                            <div className="dot"/>
                            Login with both your EOS and Ethereum Wallets.
                        </div>
                        <div className="center-aligned-row">
                            <div className="dot"/>
                            Send tokens across bridges to Ethereum or EOS.
                        </div>
                    </div>
                    <Bridge supportedChains={['EOS', 'ETH']}
                            supportedTokens={['DAPP']}/>
                </div>
            </div>
        </div>
    )
}

export default BridgePage