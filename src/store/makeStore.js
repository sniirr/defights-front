import _ from 'lodash'
import {createLogger} from 'redux-logger';
import {createDappStore, initDappCore} from "shared/dapp-core";
import {bridgeReducer, initBridge} from "shared/dapp-bridge"
import {notificationReducer} from "shared/dapp-common/components/Notification"
import {actionStatusReducer} from 'shared/dapp-common/components/ActionButton'
import {modalReducer} from "shared/dapp-common/components/Modal"
import eosCore from "shared/dapp-core/impl/dapp-core.eos";
import ethCore from "shared/dapp-core/impl/dapp-core.eth";
import {createController as createEosBridge} from "shared/dapp-bridge/impl/dapp-bridge.eos";
import {createController as createEthBridge} from "shared/dapp-bridge/impl/dapp-bridge.eth";
// import tokens from 'config/tokens.json'
import tokens from 'config/tokens.dev.json'
// import chains from 'config/chains.json'
import bridge from 'config/bridge.json'
// import tokens from 'config/tokens.dev.json'
import chains from 'config/chains.dev.json'
// import bridge from 'config/bridge.dev.json'
import {uiReducer} from "store/uiReducer";
import {gameReducer} from "store/game";
import {liquidityMiningReducer} from "store/liquidityMining";
import {statsReducer} from "store/stats";

import {combineEpics, createEpicMiddleware} from 'redux-observable';
import {filter, mapTo} from "rxjs/operators";

const epicMiddleware = createEpicMiddleware();

const logger = createLogger({
    predicate: (store, {type}) => {
        // console.log(action)
        return type !== 'LIQUIDITY_MINING.SET_POOL_INFO' && type !== 'LIQUIDITY_MINING.SET_USER_INFO'
    }
})

const pingEpic = action$ => action$.pipe(
    filter(action => action.type === 'PING'),
    mapTo({ type: 'PONG' })
);

const rootEpic = combineEpics(pingEpic)

export default () => {
    const store = createDappStore({
        reducers: {
            bridge: bridgeReducer,
            notification: notificationReducer,
            modal: modalReducer,
            actionStatus: actionStatusReducer,

            ui: uiReducer,
            game: gameReducer,
            liquidityMining: liquidityMiningReducer,
            stats: statsReducer,
        },
        middleware: [logger, epicMiddleware],
    })

    epicMiddleware.run(rootEpic);

    const {dispatch, getState} = store

    dispatch({type: 'PING'})

    dispatch(initDappCore({
        EOS: eosCore,
        ETH: ethCore,
    }, {chains, tokens}))

    const coreController = _.get(getState(), 'controllers.core')

    coreController.initRpc('EOS')

    dispatch(initBridge({
        EOS: createEosBridge(bridge),
        ETH: createEthBridge(bridge),
    }, bridge, {chains, tokens}))

    return store
}






// const CHAINS = {
//     EOS: {name: 'EOS', walletProviders: ['scatter', 'anchor', 'tokenpocket'], settings: {}},
//     ETH: {name: 'ETH', walletProviders: ['metamask'], settings: {}},
// }
//
// export default ({chains}) => {
//
// }
