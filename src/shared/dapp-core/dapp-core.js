import _ from 'lodash'
import {amountToAsset, getHandler, getMethod, showNotification} from 'shared/dapp-common/utils/utils'
import {setChains, updateChain} from "./redux/chains";
import {setTokens, tokensSelector} from './redux/tokens'
import {clearAccount, setBalance, updateAccount} from "./redux/accounts";
import {BigNumber, ethers} from 'ethers'
// import BigNumber from 'big-number'

export const initDappCore = (controllers, {chains, tokens}) => (dispatch, getState) => {

    // init
    try {
        const data = _.reduce(chains, (memo, chain, chainKey) => {
            const handler = getMethod(controllers, chainKey, 'init')
            return handler(memo)
        }, {chains, tokens})

        dispatch(setChains(data.chains))
        dispatch(setTokens(data.tokens))
    } catch (e) {
        console.error('Failed to initialize:', e)
        dispatch(showNotification({type: 'error', text: e}))
    }

    // methods
    const initRpc = async (chainKey) => {
        const {handler} = getHandler(controllers, chainKey, 'initRpc', {dispatch, state: getState()})

        try {
            const rpc = await handler()
            dispatch(updateChain(chainKey, {rpc}))
        } catch (e) {
            console.error(e)
        }
    }

    const connect = async (chainKey, opts = {}) => {

        const state = getState()
        const {handler, context: {chain}} = getHandler(controllers, chainKey, 'connect', {dispatch, state})

        try {
            const tokens = tokensSelector(state)
            const account = await handler(opts, tokens, fetchBalance)
            if (!_.isNil(account)) {
                dispatch(updateAccount(chainKey, account))
                dispatch(showNotification({type: 'success', text: `Connected to ${chain.name}`}))
            }
        } catch (e) {
            console.error(e)
            dispatch(showNotification({
                type: 'error',
                text: e.message || `Failed to connect to ${chain.name}`
            }))
        }
    }

    const fetchBalance = async (chainKey, token) => {
        const {handler} = getHandler(controllers, chainKey, 'fetchBalance', {dispatch, state: getState()})

        try {
            let balance = await handler(token)
            if (!_.isNil(balance)) {
                // const b = parseFloat(balance)
                // const b = BigNumber.from(balance)
                // dispatch(setBalance(chainKey, token.symbol,  _.isNumber(b) ? b : 0))
                // const bStr = balance.toString()
                // const b = bStr.insertAt(bStr.length - token.precision, '.')
                // let bn = BigNumber(balance)

                // let balanceStr = ethers.utils.formatUnits(balance, token.precision)



                // if (!BigNumber.isBigNumber(balance)) balance = BigNumber.from(balance)
                // let balanceStr = ethers.utils.formatUnits(balance, token.precision)
                //
                // dispatch(setBalance(chainKey, token.symbol, {balance, balanceStr}))


                dispatch(setBalance(chainKey, token.symbol, {
                    balance,
                    balanceStr: amountToAsset(balance, token, false, true),
                }))
            }
        } catch (e) {
            console.error(e)
        }
    }

    const logout = async (chainKey) => {
        const {handler, context: {chain}} = getHandler(controllers, chainKey, 'logout', {dispatch, state: getState()})

        try {
            await handler()
            dispatch(clearAccount(chainKey))
            dispatch(showNotification({type: 'success', text: `Disconnected from ${chain.name}`}))
        } catch (e) {
            console.error(e)
        }
    }

    const ctrl = {
        initRpc,
        connect,
        logout,
        fetchBalance,
    }

    dispatch({
        type: 'DAPP.CORE.SET_CTRL',
        payload: {
            ctrlName: 'core',
            ctrl,
        }
    })
}