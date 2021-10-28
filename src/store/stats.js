import {makeReducer, reduceSetFull} from "shared/dapp-common/utils/reduxUtils";
import axios from "axios";
import {DAPPBNT_POOL_ADDRESS} from "consts"
import _ from 'lodash'
// import {tokenSelector} from "shared/dapp-core";
import TOKENS from 'config/tokens.json'

export const fetchBancorStats = () => async (dispatch, getState) => {
    const poolData = await axios(`https://api-v2.bancor.network/pools?dlt_type=ethereum&dlt_id=${DAPPBNT_POOL_ADDRESS}`)
    const tokenData = await axios(`https://api-v2.bancor.network/tokens?dlt_type=ethereum&dlt_id=${TOKENS.DAPP.addresses.ETH}`)

    const start = Math.round(new Date('2021-07-30').getTime() / 1000)
    const end = Math.round(new Date().getTime() / 1000)
    const liquidityDepthData = await axios(`https://api-v2.bancor.network/history/liquidity-depth?dlt_type=ethereum&token_dlt_id=${'0x939B462ee3311f8926c047D2B576C389092b1649'}&start_date=${start}&end_date=${end}&interval=day`)

    dispatch({
        type: 'LM_STATS.SET_STATS',
        payload: {
            tokenStats: tokenData?.data?.data[0],
            poolStats: poolData?.data?.data[0],
            liquidityDepth: liquidityDepthData?.data?.data,
            price: null,
        }
    })
}

export const statsSelector = state => _.get(state, 'stats')

export const bancorPoolStatsSelector = state => {
    const {poolStats} = statsSelector(state)

    if (_.isNil(poolStats)) return {
        dappBalance: 0,
        dappUsdPrice: 0,
        poolLiquidity: 0,
        volume_24h: 0,
    }

    const {reserves, liquidity, volume_24h} = poolStats
    const dappReserve = reserves[0]

    return {
        dappBalance: dappReserve.balance?.usd,
        dappUsdPrice: dappReserve.price?.usd,
        poolLiquidity: liquidity?.usd,
        volume_24h: volume_24h?.usd,
    }
}

const INITIAL_STATE = {
    tokenStats: null,
    poolStats: null,
    liquidityDepth: null,
    price: null,
}

export const statsReducer = makeReducer({
    'LM_STATS.SET_STATS': reduceSetFull,
}, INITIAL_STATE)