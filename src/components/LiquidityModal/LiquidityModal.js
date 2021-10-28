import React, {useEffect, useState} from 'react'
import _ from 'lodash'
import {useDispatch, useSelector} from "react-redux";
import Modal, {hideModal} from "shared/dapp-common/components/Modal"
import './LiquidityModal.scss'
import Tabs from "shared/dapp-common/components/Tabs";
import {useForm} from "react-hook-form";
import Slider from "rc-slider";
import AssetInput from "shared/dapp-common/components/AssetInput";
import ActionButton from "shared/dapp-common/components/ActionButton";
import {amountToAsset, bnToBnStringPair, bnToString, removeComma} from "shared/dapp-common/utils/utils";
import classNames from "classnames";
import {balanceSelector, tokenSelector, tokensSelector} from "shared/dapp-core";
import Dropdown from "shared/dapp-common/components/Dropdown";
import {POOLS} from "consts";
import {useHistory} from "react-router-dom";
import {BigNumber, ethers} from "ethers";
import {
    stake,
    unstake,
    userPositionSelector,
    testAddSingleSidedDapp,
    lmSelector, transferPosition
} from "store/liquidityMining";
import Countdown from 'react-countdown'
import Checkbox from "shared/dapp-common/components/Checkbox";

const ViewPoolsButton = ({showViewPools}) => {
    let history = useHistory()
    const dispatch = useDispatch()

    return showViewPools ? (
        <div className="button themed btn-view-pools" onClick={() => {
            history.push('/pools')
            dispatch(hideModal())
        }}>
            <div className="button-content">View Pools</div>
        </div>
    ) : null
}

const AssetWithSliderForm = ({token, balance, value, buttonText, showViewPools, disabled, onSubmit, closeModal, children}) => {

    const {register, handleSubmit, watch, formState: {errors}, setValue} = useForm({
        mode: 'onChange',
        reValidateMode: 'onChange',
        criteriaMode: 'all',
        defaultValues: {amount: '0'}
    })

    const isFixedValue = !_.isNil(value)

    const amountStr = watch('amount')
    const amount = isFixedValue ? value.value : BigNumber.from(amountStr ? ethers.utils.parseUnits(removeComma(amountStr), token.precision) : '0')

    const setInputAmount = amount => {
        setValue('amount', amountToAsset(amount, token, false, false), {shouldValidate: true})
    }

    const onSliderChange = value => {
        setInputAmount(balance.mul(value).div(100))
    }

    const sliderValue = balance.gt(0) ? amount.mul(100).div(balance) : BigNumber.from(0)

    const submit = async formValues => {
        if (balance.isZero()) return

        await onSubmit({
            ...formValues,
            amount: removeComma(formValues.amount),
            portionPPM: amount.mul(1000000).div(balance),
        })
        // setInputAmount(BigNumber.from(0))
    }

    useEffect(() => {
        setValue('amount', isFixedValue ? value.str: '0')
    }, [value])

    return (
        <div className="asset-with-slider-form">
            <form onSubmit={handleSubmit(submit)}>
                <div className="form-inputs">
                    <div className="row input-container">
                        <div className="item">
                            <AssetInput
                                token={token}
                                name="amount"
                                label="Amount"
                                disabled={disabled || isFixedValue}
                                error={amount.gt(0) ? _.get(errors, "amount") : null}
                                maxAmount={balance || 0}
                                register={register}
                                setValue={setValue}
                                onChange={setInputAmount}
                            />
                        </div>
                    </div>
                    <div className="slider">
                        <Slider disabled={disabled || isFixedValue} marks={{0: '0%', 25: '25%', 50: '50%', 75: '75%', 100: '100%'}}
                                value={sliderValue}
                                onChange={onSliderChange}
                        />
                    </div>
                </div>
                <div className="bottom-area">{children}</div>
                <div className="row center-aligned-spaced-row submit-row">
                    <ViewPoolsButton showViewPools={showViewPools}/>
                    <ActionButton className={classNames("themed button-full")} disabled={disabled} actionKey="change-liquidity" onClick={handleSubmit(submit)}>
                        {buttonText}
                    </ActionButton>
                </div>
            </form>
        </div>
    )
}

const AddLiquidity = ({closeModal, poolId, token, showViewPools}) => {

    const dispatch = useDispatch()

    const {balance} = useSelector(balanceSelector('ETH', token.symbol))
    const {liquidityProtection} = useSelector(lmSelector)
    const [infiniteApproval, setInfiniteApproval] = useState(false)

    const addLiquidity = async ({amount}) => {
        await dispatch(stake(token, amount, poolId, infiniteApproval))
    }

    const renderAvailableSpace = () => {
        if (token.symbol !== 'DAPP') return null
        const availableSpace = _.get(liquidityProtection, 'availableSpace.DAPP', {})
        const hasSpace = !_.isNil(availableSpace.value) && availableSpace.value.gt(0)

        return (
            <div className={classNames("available-space", hasSpace ? 'text-neutral' : 'text-red')}>
                {hasSpace ? `Available space ${availableSpace.str} DAPP` : 'Pool has no space'}
            </div>
        )
    }

    return (
        <div className="add-liquidity">
            <AssetWithSliderForm onSubmit={addLiquidity} token={token} balance={balance || BigNumber.from(0)}
                                 disabled={false} buttonText="Add Liquidity"
                                 chainKey="ETH" poolId={poolId} showViewPools={showViewPools} closeModal={closeModal}>
                <div className="item-input">
                    <Checkbox checked={infiniteApproval} onChange={() => setInfiniteApproval(!infiniteApproval)}>
                        Infinite Approval
                    </Checkbox>
                </div>
                {renderAvailableSpace()}
            </AssetWithSliderForm>
        </div>
    )
}

const RemoveLiquidity = ({closeModal, poolId, token, showViewPools}) => {

    const dispatch = useDispatch()

    const userPosition = useSelector(userPositionSelector(poolId))
    const hasPosition = !_.isEmpty(userPosition)

    const {unlocksAt} = userPosition

    const isDAPP = token.symbol === 'DAPP'

    let balance = BigNumber.from(0)
    if (hasPosition) {
        balance = isDAPP ? userPosition.dappStaked.value : userPosition.lpAmount.value
    }

    const removeLiquidity = async ({amount, portionPPM}) => {
        await dispatch(unstake(token, {amount, portionPPM}, poolId))
    }

    const props = isDAPP ? {value: bnToBnStringPair(balance, token)} : {}

    const renderUnlockingMessage = () => {
        if (_.isNil(unlocksAt)) return null

        return (
            <div className="center-aligned-spaced-row unlock-box">
                {unlocksAt >= new Date() ? (
                    <>Liquidity locked <Countdown date={unlocksAt}/></>
                ) : 'Liquidity is Unlocked'}
            </div>
        )
    }

    return (
        <div className="remove-liquidity">
            <AssetWithSliderForm onSubmit={removeLiquidity} token={token} balance={balance}
                                 disabled={false} buttonText="Remove Liquidity" chainKey="ETH" poolId={poolId}
                                 showViewPools={showViewPools} closeModal={closeModal} {...props}>
                {renderUnlockingMessage()}
            </AssetWithSliderForm>
        </div>
    )
}

const CreatePosition = ({closeModal, showViewPools}) => {

    const dispatch = useDispatch()

    const token = useSelector(tokenSelector('DAPP'))
    const {balance} = useSelector(balanceSelector('ETH', token.symbol))

    const createPosition = async ({amount}) => {
        await dispatch(testAddSingleSidedDapp(amount))
    }

    return (
        <div className="add-liquidity">
            <AssetWithSliderForm onSubmit={createPosition} token={token} balance={balance || BigNumber.from(0)}
                                 disabled={false} buttonText="Create Position"
                                 chainKey="ETH" showViewPools={showViewPools} closeModal={closeModal}/>
        </div>
    )
}

const usePoolSelect = (poolId) => {

    const [selectedPoolId, setSelectedPoolId] = useState(poolId || 0)

    return {
        selectedPoolId,
        setSelectedPoolId,
        renderPoolSelect: () => (
            <div className="center-aligned-row input-container dropdown-container">
                <span className="label">Pool</span>
                <Dropdown id="pool-select" withCaret={true} items={POOLS} selectedItem={_.find(POOLS, {id: selectedPoolId})} showSelected onItemClick={({id}) => {
                    setSelectedPoolId(id)
                }}>
                    {_.get(_.find(POOLS, {id: selectedPoolId}), 'name', 'Select Pool')}
                </Dropdown>
            </div>
        )
    }
}

const LiquidityModal = ({activeTab = 0, poolId, symbol, showViewPools}) => {

    const dispatch = useDispatch()

    const tokens = useSelector(tokensSelector)

    const [selectedPoolId, setSelectedPoolId] = useState(poolId || 0)
    const [selectedToken, setSelectedToken] = useState(tokens[symbol || 'DAPP'])

    const closeModal = () => {
        dispatch(hideModal())
    }

    const renderTabContent = Comp => (
        <Comp closeModal={closeModal} poolId={selectedPoolId} token={selectedToken} showViewPools={showViewPools}/>
    )

    const tabs = [
        {title: 'Add Liquidity', component: () => renderTabContent(AddLiquidity)},
        {title: 'Remove Liquidity', component: () => renderTabContent(RemoveLiquidity)},
    ]

    return (
        <Modal className="liquidity-modal">
            <Tabs id="manage-liquidity-tabs" tabs={tabs} activeTab={activeTab} before={() => (
                <>
                    <div className="center-aligned-row input-container dropdown-container">
                        <span className="label">Token</span>
                        <Dropdown id="token-select" nameField="symbol" withCaret={true} items={tokens} selectedItem={selectedToken} showSelected onItemClick={setSelectedToken}>
                            {selectedToken.symbol}
                        </Dropdown>
                    </div>
                    <div className="center-aligned-row input-container dropdown-container">
                        <span className="label">Pool</span>
                        <Dropdown id="pool-select" withCaret={true} items={POOLS} selectedItem={_.find(POOLS, {id: selectedPoolId})} showSelected onItemClick={({id}) => {
                            setSelectedPoolId(id)
                        }}>
                            {_.get(_.find(POOLS, {id: selectedPoolId}), 'name', 'Select Pool')}
                        </Dropdown>
                    </div>
                </>
            )}/>
        </Modal>
    )
}

export const TransferPositionModal = ({position, showViewPools}) => {

    const dispatch = useDispatch()

    const {selectedPoolId, renderPoolSelect} = usePoolSelect(0)

    const {liquidityProtection} = useSelector(lmSelector)

    const [selectedPosition, setSelectedPosition] = useState(position || liquidityProtection.positions[0])

    if (_.isEmpty(liquidityProtection.positions)) return null

    const transferPos = () => {
        dispatch(transferPosition(selectedPosition.positionId, selectedPoolId))
    }

    const positionOptions = _.map(liquidityProtection.positions, p => ({
        ...p,
        name: bnToString(p.poolTokenAmount.value, {precision: 18, prettify: true, maxDecimalPlaces: 4})
    }))

    return (
        <Modal className="liquidity-modal" title="Transfer Position">
            <form onSubmit={() => false}>
                <div className="form-inputs">
                    <div className="center-aligned-row input-container dropdown-container">
                        <span className="label">Position</span>
                        <Dropdown id="position-select" withCaret={true} items={positionOptions} selectedItem={selectedPosition} showSelected onItemClick={setSelectedPosition}>
                            {bnToString(selectedPosition.poolTokenAmount.value, {precision: 18, prettify: true, maxDecimalPlaces: 4})}
                        </Dropdown>
                    </div>
                    {renderPoolSelect()}
                </div>
                <div className="bottom-area"/>
                <div className="row center-aligned-spaced-row submit-row">
                    <ViewPoolsButton showViewPools={showViewPools}/>
                    <ActionButton className={classNames("themed button-full")} actionKey="transfer-position" onClick={transferPos}>
                        Transfer Position
                    </ActionButton>
                </div>
            </form>
        </Modal>
    )
}

export const CreatePositionModal = ({showViewPools}) => {
    return (
        <Modal className="liquidity-modal" title="Create Position">
            <CreatePosition showViewPools={showViewPools}/>
        </Modal>
    )
}

export default LiquidityModal
