import React from 'react'
import _ from 'lodash'
import './LandingPage.scss'
import {useHistory} from "react-router-dom";
import {useSelector} from "react-redux";
import Wheel from "components/Wheel";
import {guildIdSelector} from "store/game";
import {TEAMS} from "consts";
import {tvlIcon, accountIcon, barsIcon} from 'images'
import numeral from 'numeral'
import Button from "components/Button";
import {lmSelector} from "store/liquidityMining";
import {bnToString} from "shared/dapp-common/utils/utils";
import {BigNumber} from 'ethers'

const LandingPage = () => {

    let history = useHistory()
    const selectedGuildId = useSelector(guildIdSelector)
    const {userPoolTotalEntries, pools} = useSelector(lmSelector)

    const totalDappBnt = _.reduce(pools, (sum, {totalLpStaked}) => sum.add(totalLpStaked.value), BigNumber.from(0))

    return (
        <div className="page landing">
            <div className="page-inner">
                <div className="spaced-row">
                    <div className="left">
                        <div className="main-text">
                            Power Up Your DeFi Mining with the <span className="highlight">DAPP Network</span>
                        </div>
                        <div className="list">
                            <div className="list-item center-aligned-row">
                                <div className="dot"/>Multi-Chain Yield Farming
                            </div>
                            <div className="list-item center-aligned-row">
                                <div className="dot"/>Single-Sided Staking
                            </div>
                            <div className="list-item center-aligned-row">
                                <div className="dot"/>Impermanent Loss Protection
                            </div>
                        </div>
                        <Button className="button-full button-mine" onClick={() => history.push('dashboard')}>
                            <div className="button-content">Start Mining Now</div>
                        </Button>
                        <div className="stats">
                            <div className="stats-entry">
                                <img src={tvlIcon} alt="TVL"/>
                                <div className="number">{bnToString(totalDappBnt, {precision: 18, maxDecimalPlaces: 4, prettify: true})}</div>
                                <div className="stat-label">Total Value Locked</div>
                            </div>
                            <div className="stats-entry">
                                <img src={accountIcon} alt="Accounts"/>
                                <div className="number">{numeral(userPoolTotalEntries).format('0,0')}</div>
                                <div className="stat-label">Active Pool Entries</div>
                            </div>
                            <div className="stats-entry">
                                <img src={barsIcon} alt="APR"/>
                                <div className="number">0%</div>
                                <div className="stat-label">Max APR</div>
                            </div>
                        </div>
                    </div>
                    <div className="right">
                        <Wheel/>
                        <div className="button themed" onClick={() => history.push('story')}>
                            <div className="button-content">DeFights Story</div>
                        </div>
                        {selectedGuildId > -1 && (
                            <div className="guild-info">
                                <div className="guild-words">{_.toUpper(TEAMS[selectedGuildId].words)}</div>
                                <div className="guild-desc">{TEAMS[selectedGuildId].description}</div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default LandingPage