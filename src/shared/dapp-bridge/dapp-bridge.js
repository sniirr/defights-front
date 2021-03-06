import {makeReducer, reduceSetKey, reduceUpdateFull, reduceUpdateKey} from "shared/dapp-common/utils/reduxUtils";
import _ from "lodash";
import {getHandler as baseGetHandler, getMethod, showNotification} from "shared/dapp-common/utils/utils";
import {clearActionStatus, setActionPending} from "shared/dapp-common/components/ActionButton";
import {accountSelector} from "shared/dapp-core";

export const BRIDGE_REGISTRY_ERROR = {
    NOT_READY: 0,
    NOT_REGISTERED: 1,
    ACCOUNT_MISMATCH: 2,
}

const getHandler = (controllers, chainKey, method, {dispatch, state}) =>
    baseGetHandler(controllers, chainKey, method, {dispatch, state}, state => ({bridge: _.get(state, 'bridge', {})}))

export const initBridge = (controllers, config, {chains, tokens}) => (dispatch, getState) => {

    const {bridgeRegistry, bridges} = config
    const {chainKey: registerOn} = bridgeRegistry

    const state = getState()
    const coreController = _.get(state, 'controllers.core')

    if (_.isNil(coreController)) {
        return console.error(`Failed to initBridge - coreController must be initialized before calling initBridge`)
    }

    // INIT
    try {
        const bridgeInitData = _.reduce(chains, (memo, chain, chainKey) => {
            const {handler} = getHandler(controllers, chainKey, 'init', {dispatch, state})
            return {
                ...memo,
                ...handler(),
            }
        }, {})

        dispatch({
            type: 'DAPP.BRIDGE.INIT',
            payload: {
                ...bridgeInitData,
                config,
            },
        })
    }
    catch (e) {
        console.error(e)
        dispatch(showNotification({type: 'error', text: 'Failed to initBridge'}))
    }

    // CONFIG
    const fetchSupportedTokens = async () => {
        try {
            const {handler} = getHandler(controllers, registerOn, 'fetchSupportedTokens', {dispatch, state: getState()})
            const tokens = await handler()

            dispatch({
                type: 'DAPP.BRIDGE.SET_TOKENS',
                payload: tokens,
            })
        }
        catch (e) {
            console.error(e)
            dispatch(showNotification({type: 'error', text: 'Failed to fetch supported tokens'}))
        }
    }

    // REGISTER
    const fetchRegistry = async () => {
        const {handler} = getHandler(controllers, registerOn, 'fetchRegistry', {dispatch, state: getState()})

        try {
            const registry = await handler()
            dispatch({
                type: 'BRIDGE.SET_REGISTRY',
                payload: registry || {}
            })
        }
        catch (e) {
            console.error(e)
            dispatch(showNotification({type: 'error', text: 'Failed to fetch registry info'}))
        }
    }

    const fetchRegFee = async () => {
        const {handler} = getHandler(controllers, registerOn, 'fetchRegFee', {dispatch, state: getState()})

        try {
            const fee = await handler()
            dispatch({
                type: 'BRIDGE.SET_REG_FEE',
                payload: fee
            })
        }
        catch (e) {
            console.error(e)
            dispatch(showNotification({type: 'error', text: 'Failed to fetch registration fee'}))
        }
    }

    const awaitRegister = () => {
        const {handler} = getHandler(controllers, registerOn, 'awaitRegister', {dispatch, state: getState()})
        handler(registry => {
            dispatch({
                type: 'BRIDGE.SET_REGISTRY',
                payload: registry,
            })
            dispatch(clearActionStatus('register'))
            dispatch(showNotification({type: 'success', text: `Registered successfully`}))
        })
    }

    const register = async (newAddress, regFee, isModify) => {
        const {handler} = getHandler(controllers, registerOn, 'register', {dispatch, state: getState()})

        try {
            dispatch(setActionPending('register'))
            await handler(newAddress, regFee, isModify)
            awaitRegister()
        }
        catch (e){
            console.error(e)
            dispatch(clearActionStatus('register'))
            dispatch(showNotification({type: 'error', text: e.message || e}))
        }
    }

    const isRegisteredSelector = state => {
        const selector = getMethod(controllers, registerOn, 'isRegisteredSelector')

        return selector(state)
    }

    // TRANSFER
    const fetchTransferFee = async token => {
        const {handler} = getHandler(controllers, registerOn, 'fetchTransferFee', {dispatch, state: getState()})

        try {
            const fee = await handler(token)
            dispatch({
                type: 'BRIDGE.SET_TX_FEE',
                payload: fee || {}
            })
        }
        catch (e) {
            console.error(e)
            dispatch(showNotification({type: 'error', text: 'Failed to fetch transaction fee'}))
        }
    }

    const awaitDeposit = (chainKey, token) => {
        const {handler} = getHandler(controllers, chainKey, 'awaitDeposit', {dispatch, state: getState()})

        try {
            handler(token, payload => {
                dispatch({
                    type: 'BRIDGE.SET_TX_STATUS',
                    payload,
                })
                dispatch(clearActionStatus('transfer'))
                coreController.fetchBalance(chainKey, token)
            })
        }
        catch (e) {
            console.error(e)
            // dispatch(clearTxStatus())
            // dispatch(clearActionStatus('transfer'))
            dispatch(showNotification({type: 'error', text: e.message}))
        }
    }

    const awaitReceived = (fromChainKey, toChainKey, token) => {
        const state = getState()
        const {handler} = getHandler(controllers, toChainKey, 'awaitReceived', {dispatch, state})
        const fromAccount = accountSelector(fromChainKey)(state)

        try {
            handler(fromAccount, token, payload => {
                dispatch({
                    type: 'BRIDGE.SET_TX_STATUS',
                    payload,
                })
                coreController.fetchBalance(toChainKey, token)
            })
        }
        catch (e) {
            console.error(e)
            // dispatch(clearTxStatus())
            // dispatch(clearActionStatus('transfer'))
            dispatch(showNotification({type: 'error', text: e.message}))
        }
    }

    const clearTxStatus = () => dispatch({type: 'BRIDGE.CLEAR_TX_STATUS'})

    const transfer = async (fromChain, toChain, amount, token, infiniteApproval) => {
        const {handler} = getHandler(controllers, fromChain, 'transfer', {dispatch, state: getState()})

        const onError = e => {
            console.error(e)
            dispatch(clearTxStatus())
            dispatch(clearActionStatus('transfer'))
            dispatch(showNotification({type: 'error', text: e.message}))
        }

        try {
            const tokenEthContract = _.get(token, 'contracts.ETH')
            tokenEthContract.removeAllListeners()

            dispatch(setActionPending('transfer'))
            awaitDeposit(fromChain, token)
            const response = await handler(amount, token, infiniteApproval, onError)

            dispatch({
                type: 'BRIDGE.SET_TX_STATUS',
                payload: {depositTxId: response?.transaction_id, active: true, fromChainKey: fromChain, toChainKey: toChain}
            })

            awaitReceived(fromChain, toChain, token)
        }
        catch (e) {
            onError(e)
        }
    }

    const updatePrices = async () => {
        const {handler} = getHandler(controllers, registerOn, 'updatePrices', {dispatch, state: getState()})

        try {
            await handler()
            dispatch(showNotification({type: 'success', text: `Prices updated successfully`}))
        }
        catch (e) {
            console.error(e)
            dispatch(showNotification({type: 'error', text: e.message}))
        }
    }

    const ctrl = {
        // onLogin,
        fetchSupportedTokens,
        fetchRegistry,
        fetchRegFee,
        register,
        isRegisteredSelector,

        updatePrices,

        fetchTransferFee,
        transfer,
        clearTxStatus,
    }

    dispatch({
        type: 'DAPP.CORE.SET_CTRL',
        payload: {
            ctrlName: 'bridge',
            ctrl,
        }
    })

    return ctrl
}

// selectors
export const bridgeSelector = state => _.get(state, 'bridge')
export const registrySelector = state => _.get(state, 'bridge.registry')
export const regFeeSelector = state => _.get(state, 'bridge.regFee')

const INITIAL_STATE = {
    tokens: {},
    registry: null,
    regFee: [-1, 'EOS'],
    txFee: {},
    txStatus: {
        active: false,
        deposited: false,
        depositTxId: '',
        received: false,
        receivedTxId: '',
        fromChainKey: '',
        toChainKey: '',
        // fromChainKey: 'EOS',
        // toChainKey: 'ETH',
        // active: true,
        // deposited: true,
        // depositTxId: 'skdhfksjhdf',
        // received: true,
        // receivedTxId: 'jdflsdjflj',
    },
}

export const bridgeReducer = makeReducer({
    'DAPP.BRIDGE.INIT': reduceUpdateFull,
    'DAPP.BRIDGE.UPDATE': reduceUpdateFull,
    'DAPP.BRIDGE.SET_TOKENS': reduceSetKey('tokens'),
    'BRIDGE.SET_REGISTRY': reduceSetKey('registry'),
    'BRIDGE.SET_REG_FEE': reduceSetKey('regFee'),
    'BRIDGE.SET_TX_FEE': reduceSetKey('txFee'),
    'BRIDGE.SET_TX_STATUS': reduceUpdateKey('txStatus'),
    'BRIDGE.CLEAR_TX_STATUS': state => ({
        ...state,
        txStatus: INITIAL_STATE.txStatus,
    }),
}, INITIAL_STATE)