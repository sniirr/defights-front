import React from 'react'
import _ from 'lodash'
import classNames from 'classnames'
import {amountToAsset, removeComma} from "shared/dapp-common/utils/utils";
import './AssetInput.scss'
import {BigNumber} from "ethers";


export const AssetInput = ({token, name = "amount", label, apiKey, maxAmount, register, setValue, onChange, error, disabled, canBeZero, validations = {}, ...inputProps}) => {
    const withMax = _.isNumber(maxAmount) || BigNumber.isBigNumber(maxAmount)

    const _onChange = value => _.isFunction(onChange) && onChange(removeComma(value))

    const _onMaxClick = () => {
        _onChange(maxAmount)
        setValue(name, amountToAsset(maxAmount, token, false, false), {shouldValidate: true})
    }

    // const processValue = v => {
    //     return removeComma(v)
    //     // const fValue = parseFloat(removeComma(v))
    //     // return !_.isNaN(fValue) ? fValue : 0
    // }

    const hasError = !_.isNil(error)

    return (
        <div className={classNames("input asset-input", {'with-error': hasError})}>
            <div className={classNames("center-aligned-spaced-row")}>
                {label && (
                    <span>{label}</span>
                )}
                <div className="max-amount">
                    {withMax && (
                        <span onClick={_onMaxClick}>max: {amountToAsset(maxAmount, token, false, true)}</span>
                    )}
                </div>
            </div>
            <input type="text" disabled={disabled} defaultValue="0"
                   onChange={e => _onChange(e.target.value)}
                   {...inputProps}
                   {...register(name, {
                       // setValueAs: processValue,
                       validate: {
                           // positive: v => {
                           //     const fv = parseFloat(v)
                           //     console.log('VALIDATING positive', (canBeZero ? fv >= 0 : fv > 0) || "Must be greater then 0")
                           //     return (canBeZero ? fv >= 0 : fv > 0) || "Must be greater then 0"
                           // },
                           maxExceeded: v => {
                               return !withMax || parseFloat(removeComma(v)) <= maxAmount || "Max amount exceeded"
                           },
                           ...validations,
                       }
                   })}
            />
            {hasError && (
                <div className="error">{error.message}</div>
            )}
        </div>
    )
}

export default AssetInput