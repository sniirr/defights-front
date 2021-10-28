import React, {useEffect} from 'react'
import _ from 'lodash'
import './ClaimableBnt.scss'
import {useDispatch, useSelector} from "react-redux";
import {
    claimableBntSelector,
    lmSelector,
    claimUserBnt,
    fetchLockedBntBalances,
    claimContractBnt, fetchContractBntBalance
} from "store/liquidityMining";
import {POOLS} from "consts";
import ActionButton from "shared/dapp-common/components/ActionButton"
import Countdown from 'react-countdown'

const padCountdownValue = value => {
    return (''+value).length === 1 ? `0${value}` : value
}

const countdownRenderer = ({hours, minutes, seconds}) => `${hours}:${padCountdownValue(minutes)}:${padCountdownValue(seconds)}`

const claimButtonTooltip = (contractClaimRequired, isLocked) => {
    if (isLocked) {
        return 'BNT is locked'
    }
    if (contractClaimRequired) {
        return 'Claim Contract BNT is required'
    }
    return ''
}

const ClaimableBnt = () => {
    const dispatch = useDispatch()

    const {liquidityProtection} = useSelector(lmSelector)
    const {claimableBntPools, contractClaimAvailable} = useSelector(claimableBntSelector)

    // console.log('claimableBntPools', claimableBntPools)

    useEffect(() => {
        const fetchData = async () => {
            if (!_.isEmpty(liquidityProtection)) {
                dispatch(await fetchContractBntBalance())
                dispatch(fetchLockedBntBalances())
            }
        }
        fetchData()
    }, [liquidityProtection])

    const hasClaimableBnt = !_.isEmpty(claimableBntPools)

    return hasClaimableBnt ? (
        <div className="panel claimable-bnt">
            <div className="panel-content">
                <div className="panel-header">Claim BNT</div>
                {contractClaimAvailable && (
                    <div className="contract-claim">
                        <div className="text">
                            Claimable BNT is unlocked in Bancor and needs to be claimed by the Defights contract before you can claim it.
                        </div>
                        <ActionButton className="themed button-full claim-contract-button" actionKey="claim-bnt"
                                      onClick={() => {dispatch(claimContractBnt())}}>
                            Claim Contract BNT
                        </ActionButton>
                    </div>
                )}
                {_.map(claimableBntPools, ({poolId, amountStr, contractClaimRequired, isLocked, expirationTime}) => {
                    return (
                        <div key={`claimable-bnt-${poolId}`} className="center-aligned-spaced-row claim-row">
                            <div className="pool-name">{_.find(POOLS, {id: +poolId})?.name}</div>
                            <div className="number">{amountStr} BNT</div>
                            <ActionButton className="themed" actionKey={`claim-user-bnt-${poolId}`}
                                          disabled={contractClaimRequired} title={claimButtonTooltip(contractClaimRequired, isLocked)}
                                          onClick={() => dispatch(claimUserBnt(poolId))}>
                                {isLocked ? <Countdown date={expirationTime} renderer={countdownRenderer}/> : 'Claim'}
                            </ActionButton>
                        </div>
                    )
                })}
            </div>
        </div>
    ) : null
}


export default ClaimableBnt