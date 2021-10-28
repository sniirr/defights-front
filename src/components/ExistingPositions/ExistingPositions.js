import React from 'react'
import _ from 'lodash'
import './ExistingPosition.scss'
import {bnToString} from "shared/dapp-common/utils/utils";
import {useDispatch, useSelector} from "react-redux";
import {showModal} from "shared/dapp-common/components/Modal";
import {lmSelector} from "store/liquidityMining";

const ExistingPositions = ({showViewPools}) => {
    const dispatch = useDispatch()

    const {liquidityProtection} = useSelector(lmSelector)

    const hasPositions = !_.isEmpty(liquidityProtection.positions)

    const showTransferPositionModal = position => {
        dispatch(showModal('transfer-position', {position, showViewPools}))
    }

    return hasPositions ? (
        <div className="panel existing-positions">
            <div className="panel-content">
                <div className="panel-header">
                    Unstaked positions
                </div>
                {_.map(liquidityProtection.positions, position => {
                    const {positionId, poolTokenAmount} = position
                    return (
                        <div key={`existing-pos-${positionId}`} className="center-aligned-spaced-row position-row">
                            <div className="number">{bnToString(poolTokenAmount.value, {precision: 18, prettify: true, maxDecimalPlaces: 4})} DAPPBNT</div>
                            <div className="button themed button-full btn-add-liquidity" onClick={() => showTransferPositionModal(position)}>
                                <div className="button-content">Transfer Position</div>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    ) : null
}


export default ExistingPositions