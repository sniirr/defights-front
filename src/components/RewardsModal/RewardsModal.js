import React, {useEffect} from 'react'
import _ from 'lodash'
import {useDispatch, useSelector} from "react-redux";
import Modal from "shared/dapp-common/components/Modal"
import './RewardsModal.scss'
import {POOLS} from "consts"
import {
    updateRewards,
    claimRewards,
    pendingRewardsSelector,
    fetchUserPoolRewards
} from "store/liquidityMining";
import ActionButton from "shared/dapp-common/components/ActionButton";
import {bnToString} from "shared/dapp-common/utils/utils";

const RewardsModal = ({}) => {

    const dispatch = useDispatch()

    const rewards = useSelector(pendingRewardsSelector)

    useEffect(() => {
        dispatch(fetchUserPoolRewards())
    }, [])

    const update = poolId => {
        dispatch(updateRewards(poolId))
    }

    const claim = poolId => {
        dispatch(claimRewards(poolId))
    }

    return (
        <Modal className="rewards-modal" title="Claim Rewards">
            {_.size(rewards) > 0 ? _.map(rewards, (pending, poolId) => (
                <div key={`rewards-pool-row-${poolId}`} className="pool-row center-aligned-spaced-row">
                    <div className="pool-name">{_.find(POOLS, {id: +poolId})?.name}</div>
                    <div className="pending-rewards">{bnToString(pending.value, {precision: 18, prettify: true, maxDecimalPlaces: 4})} DAPP</div>
                    <div className="buttons">
                        <ActionButton actionKey={`update-rewards-${poolId}`} className="themed" onClick={() => update(poolId)}>UPDATE</ActionButton>
                        <ActionButton actionKey={`claim-rewards-${poolId}`} className="themed button-full" onClick={() => claim(poolId)}>CLAIM</ActionButton>
                    </div>
                </div>
            )) : (
                <div className="empty-view">
                    No staked pools
                </div>
            )}
        </Modal>
    )
}

export default RewardsModal
