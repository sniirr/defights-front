import React from 'react'
import './PoolsPage.scss'
import _ from "lodash";
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome'
import {faLock} from '@fortawesome/free-solid-svg-icons'
import DashboardHeader from "layout/DashboardHeader"
import {useDispatch, useSelector} from "react-redux";
import {showModal} from "shared/dapp-common/components/Modal";
import {POOLS} from "consts";
import {lmSelector} from "store/liquidityMining";
import {bnToString} from "shared/dapp-common/utils/utils";
import ExistingPositions from "components/ExistingPositions";
import Button from "components/Button";
import {accountSelector} from "shared/dapp-core";
import {BigNumber} from 'ethers'
import numeral from'numeral'
import ClaimableBnt from "components/ClaimableBnt";

const PoolsPanel = () => {

    const dispatch = useDispatch()

    const {pools, userInfo} = useSelector(lmSelector)
    const account = useSelector(accountSelector('ETH'))

    const getAprString = v => v > 0 ? `${numeral(v).format('0,0.[00]')}%` : 'N/A'

    return (
        <div className="panel pools-panel">
            <div className="panel-content">
                <div className="panel-header">
                    Pools
                </div>
                <div className="subheader">BANCOR POOLS</div>
                <div className="pools">
                    {!_.isEmpty(pools) && _.map(POOLS, ({id, name}) => {
                        const pool = _.get(pools, id + '')
                        if (_.isNil(pool)) return null

                        const {totalDappBntStaked, totalDappStaked, dappAPR, lpAPR, timeLocked} = pool

                        const userPoolInfo = _.get(userInfo, id + '')
                        const ssStake = _.get(userPoolInfo, 'dappStaked.value', BigNumber.from(0))
                        const dsStake = _.get(userPoolInfo, 'lpAmount.value', BigNumber.from(0))

                        return (
                            <div key={`pool-item-${id}`} className="panel pool-item">
                                <div className="panel-content">
                                    <div className="pool-name">
                                        {timeLocked > 0 && (
                                            <FontAwesomeIcon icon={faLock}/>
                                        )}
                                        {name}
                                    </div>
                                    <div className="subheader">DAPP POOL</div>
                                    <div className="pool-info center-aligned-row">
                                        <div className="stats-entry small">
                                            <div className="number">{bnToString(totalDappStaked.value, {precision: 18, prettify: true, maxDecimalPlaces: 4})}</div>
                                            <div>Total Stake</div>
                                        </div>
                                        <div className="stats-entry small">
                                            <div className="number">{getAprString(dappAPR)}</div>
                                            <div>APR</div>
                                        </div>
                                    </div>
                                    <div className="subheader">DAPPBNT POOL</div>
                                    <div className="pool-info center-aligned-row">
                                        <div className="stats-entry small">
                                            <div className="number">{bnToString(totalDappBntStaked.value, {precision: 18, prettify: true, maxDecimalPlaces: 4})}</div>
                                            <div>Total Stake</div>
                                        </div>
                                        <div className="stats-entry small">
                                            <div className="number">{getAprString(lpAPR)}</div>
                                            <div>APR</div>
                                        </div>
                                    </div>
                                    {!_.isEmpty(account?.address) && (
                                        <>
                                            <div className="subheader">YOUR STAKE</div>
                                            <div className="pool-info your-stake center-aligned-row">
                                                <div className="stats-entry small">
                                                    <div className="number">{bnToString(ssStake, {precision: 18, prettify: true, maxDecimalPlaces: 4})}</div>
                                                    <div>DAPP</div>
                                                </div>
                                                <div className="stats-entry small">
                                                    <div className="number">{bnToString(dsStake, {precision: 18, prettify: true, maxDecimalPlaces: 4})}</div>
                                                    <div>DAPPBNT</div>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                    <div className="buttons center-aligned-spaced-row">
                                        <div className="button themed button-full btn-add-liquidity"
                                             onClick={() => dispatch(showModal('liquidity', {activeTab: 0, poolId: id}))}>
                                            <div className="button-content">Add Liquidity</div>
                                        </div>
                                        <div className="button themed btn-remove-liquidity"
                                             onClick={() => dispatch(showModal('liquidity', {activeTab: 1, poolId: id}))}>
                                            <div className="button-content">Remove Liquidity</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}

const PoolsPage = () => {
    const dispatch = useDispatch()

    const account = useSelector(accountSelector('ETH'))

    const showCreatePosition = () => {
        dispatch(showModal('create-pos', {}))
    }

    return (
        <div className="page pools-page">
            <div className="page-inner">
                <DashboardHeader/>
                {!_.isEmpty(account) && (
                    <>
                        {/*<div className="create-position">*/}
                        {/*    <Button className="themed" onClick={showCreatePosition}>Create Position</Button>*/}
                        {/*</div>*/}
                        <ExistingPositions/>
                        <ClaimableBnt/>
                    </>
                )}
                <PoolsPanel/>
            </div>
        </div>
    )
}

export default PoolsPage