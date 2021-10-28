import React, {useEffect} from 'react'
import './Dashboard.scss'
import numeral from 'numeral'
import {valueUpIcon} from "images";
import _ from 'lodash'
import SVG from 'components/SVG'
import DashboardHeader from "layout/DashboardHeader"
import {bnToString} from "shared/dapp-common/utils/utils";
import {useDispatch, useSelector} from "react-redux";
import {showModal} from "shared/dapp-common/components/Modal";
import Button from "components/Button";
import {userAggSelector} from "store/liquidityMining";
import {bancorPoolStatsSelector, fetchBancorStats, statsSelector} from 'store/stats'
import ExistingPositions from "components/ExistingPositions";
import ClaimableBnt from "components/ClaimableBnt";
import {ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip} from "recharts";
import {guildIdSelector} from "store/game";
import {TEAMS} from "consts";
import {format as formatDate} from 'date-fns'

const formatNum = n => numeral(n).format('0,0.[00]')

const PortfolioPanel = () => {
    const dispatch = useDispatch()

    const userAgg = useSelector(userAggSelector)

    return (
        <div className="panel pool">
            <div className="panel-content">
                <div className="panel-header">
                    Portfolio
                </div>
                <div className="subheader">PORTFOLIO OVERVIEW</div>
                <div className="stats-area">
                    <div className="stats-entry">
                        <div className="number">{formatNum(0)}</div>
                        <div>Total Rewards Earned</div>
                    </div>
                    <div className="stats-entry">
                        <div className="number">
                            {formatNum(0)}%
                            <SVG src={valueUpIcon}/>
                        </div>
                        <div>My Accumulative APR</div>
                    </div>
                    <div className="stats-entry small">
                        <div className="number">N/A</div>
                        <div>Stake Lock Timer</div>
                    </div>
                    {/*<div className="stats-entry small">*/}
                    {/*    <div className="nft-icons center-aligned-row">*/}
                    {/*        <SVG src={outfitIcon} className={classNames({active: true})}/>*/}
                    {/*        <SVG src={powerIcon} className={classNames({active: false})}/>*/}
                    {/*        <SVG src={gadgetIcon} className={classNames({active: false})}/>*/}
                    {/*        <SVG src={accessoryIcon} className={classNames({active: true})}/>*/}
                    {/*    </div>*/}
                    {/*    <div>Active NFTs Power Ups</div>*/}
                    {/*</div>*/}
                    <div className="stats-entry small">
                        <div className="number">{bnToString(userAgg.totalDappStaked, {
                            precision: 18,
                            prettify: true,
                            maxDecimalPlaces: 4
                        })}</div>
                        <div>Total DAPP Staked</div>
                        {/*<div>Total DAPP Staked</div>*/}
                    </div>
                    <div className="stats-entry small">
                        <div className="number">{bnToString(userAgg.totalDappBntStaked, {
                            precision: 18,
                            prettify: true,
                            maxDecimalPlaces: 4
                        })}</div>
                        <div>Total DAPPBNT Staked</div>
                        {/*<div>Total DAPP Staked</div>*/}
                    </div>
                    <div className="stats-entry small">
                        <div className="number">{bnToString(userAgg.pendingRewards, {
                            precision: 18,
                            prettify: true,
                            maxDecimalPlaces: 4
                        })} DAPP
                        </div>
                        <div>Unclaimed Rewards</div>
                    </div>


                    {/*<div className="button themed button-full btn-add-liquidity">*/}
                    {/*    <div className="button-content">Add Liquidity</div>*/}
                    {/*</div>*/}
                    {/*<div className="button themed btn-claim-rewards">*/}
                    {/*    <div className="button-content">Claim Rewards</div>*/}
                    {/*</div>*/}
                    {/*<div className="button themed btn-remove-liquidity">*/}
                    {/*    <div className="button-content">Remove Liquidity</div>*/}
                    {/*</div>*/}
                </div>
                <Button className="themed btn-claim-rewards" onClick={() => dispatch(showModal('rewards'))}>
                    Claim Rewards
                </Button>
            </div>
        </div>
    )
}

const formatGraphDate = v => v !== 'auto' ? formatDate(v, 'dd/MM') : ''

const renderTooltip = props => {
    if (_.isEmpty(props.payload)) return null

    const {timestamp, usd} = _.get(props, ['payload', 0, 'payload'])
    return (
        <div className="tooltip">
            <div className="tooltip-row">
                Date: {formatGraphDate(timestamp)}
            </div>
            <div className="tooltip-row">
                TVL: {numeral(usd).format('0,0.00')}
            </div>
        </div>
    )
}

const getGraphYTicks = (values, tickCount) => {
    const max = _.max(values)
    const topTick = Math.ceil(max / 1000000) * 1000000
    const step = topTick / (tickCount - 1)
    const output = []
    for (let i = 0; i < tickCount; i++) {
        output.unshift(topTick - step * i)
    }

    return output
}

const StatsPanel = () => {

    const dispatch = useDispatch()

    const {liquidityDepth} = useSelector(statsSelector)
    const {dappBalance, dappUsdPrice, poolLiquidity, volume_24h} = useSelector(bancorPoolStatsSelector)

    const guildId = useSelector(guildIdSelector)
    const guildColor = _.get(TEAMS, [guildId, 'color'], TEAMS[0].color)

    useEffect(() => {
        dispatch(fetchBancorStats())
    }, [])

    return (
        <div className="panel stats-panel">
            <div className="panel-content">
                <div className="panel-header">
                    Statistics
                </div>
                <div className="subheader">TOTAL VALUE LOCKED</div>
                <div className="stats-row">
                    <div className="graph">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={liquidityDepth} margin={{top: 0, right: 10, left: 10, bottom: 5}}>
                                <defs>
                                    <linearGradient id="colorGrad" x1="1" y1="0" x2="0" y2="0">
                                        <stop offset="0%" stopColor={guildColor} stopOpacity={0.8}/>
                                        <stop offset="100%" stopColor={guildColor} stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="timestamp" tickFormatter={formatGraphDate} tickCount={8} angle={-40}
                                       tickMargin={10}/>
                                <YAxis type="number" domain={[0, dataMax => dataMax * 1.1]}
                                       ticks={getGraphYTicks(_.map(liquidityDepth, 'usd'), 5)}
                                       tickFormatter={v => numeral(v).format('0,0.[00]a')}
                                       label={{
                                           value: "USD Value",
                                           fill: '#969799',
                                           offset: -5,
                                           angle: -90,
                                           position: 'insideLeft'
                                       }}/>
                                <Tooltip content={renderTooltip}/>
                                <Area dataKey="usd" stroke={guildColor} strokeWidth={0} fill="url(#colorGrad)"
                                      fillOpacity={1} isAnimationActive={true}/>
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="stats-list">
                        <div className="stats-entry">
                            <div className="number">{formatNum(poolLiquidity)}$</div>
                            <div>TVL</div>
                        </div>
                        <div className="stats-entry small">
                            <div className="number">{formatNum(dappBalance)} DAPP</div>
                            <div>DAPP Liquidity Depth</div>
                        </div>
                        <div className="stats-entry small">
                            <div className="number">{dappUsdPrice}$</div>
                            <div>DAPP Price</div>
                        </div>
                        <div className="stats-entry small">
                            <div className="number">{formatNum(volume_24h)}$</div>
                            <div>24H Volume</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

const Dashboard = () => {
    return (
        <div className="page dashboard">
            <div className="page-inner">
                <DashboardHeader/>
                <PortfolioPanel/>
                <ExistingPositions showViewPools={true}/>
                <ClaimableBnt/>
                <StatsPanel/>
            </div>
        </div>
    )
}

export default Dashboard