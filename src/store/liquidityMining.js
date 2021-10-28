import {makeReducer, reduceSetKey, reduceUpdateFull, reduceUpdateKey} from "shared/dapp-common/utils/reduxUtils";
import stakingPoolAbi from 'config/abi/DappStakingPool.json'
import liquidityProtectionAbi from 'config/abi/BancorLiquidityProtection.json'
import liquidityProtectionStoreAbi from 'config/abi/BancorLiquidityProtectionStore.json'
import {STAKING_POOL_ADDRESS, BANCOR_LIQUIDITY_PROTECTION_ADDRESS, DAPPBNT_POOL_ADDRESS, BANCOR_LIQUIDITY_PROTECTION_STORE_ADDRESS} from "consts";
import _ from "lodash";
import {accountSelector, chainSelector, tokenSelector, tokensSelector} from "shared/dapp-core";
import {checkAndApproveAllowance, fetchBalance} from "shared/dapp-core/impl/dapp-core.eth"
import {ethers, BigNumber} from "ethers";
import {bnToBnStringPair, bnToString, showNotification} from "shared/dapp-common/utils/utils";
import {POOLS} from "consts";
import {clearActionStatus, setActionPending} from "shared/dapp-common/components/ActionButton";

const getBlockTimestamp = async state => {
    const {provider} = chainSelector('ETH')(state)
    const blockNum = await provider.getBlockNumber()
    const block = await provider.getBlock(blockNum)

    return block.timestamp
}

export const calculatePoolAPR = (pool, distribution) => {

    const {dappPerBlock, totalAllocPoint} = distribution
    const {totalDappStaked, totalDappBntStaked, totalLpStaked, allocPoint}= pool

    if (!dappPerBlock || !totalAllocPoint || !totalDappStaked.value.gt(0)) return {dappAPR: 0}

    const poolDappPerBlock = allocPoint.value.mul(10000).div(totalAllocPoint.value).mul(dappPerBlock.value).div(10000)

    // console.log({dappPerBlock, totalAllocPoint})
    // console.log({totalDappStaked, totalDappBntStaked, totalLpStaked, allocPoint})

    const ssDappBnt = totalLpStaked.value.sub(totalDappBntStaked.value)

    const dappToDappBntRate = totalDappStaked.value.mul(10000).div(ssDappBnt)

    console.log('calculatePoolAPR poolId', pool.poolId)
    console.log('dappToDappBntRate', bnToString(dappToDappBntRate, {precision: 4}))

    const poolDappPerYear = poolDappPerBlock.mul(6538 * 365)

    const dappPerDappBntAYear = poolDappPerYear.div(totalLpStaked.value)
    // const dappPerDappBntAYear = poolDappPerYear.mul(100).mul(100).div(totalLpStaked.value)
    // const dappBntAPR = poolDappPerYear.mul(100).mul(100).div(totalLpStaked.value)

    console.log('dappPerDappBntAYear', bnToString(dappPerDappBntAYear, {precision: 2}))

    console.log('dappBntAPR', bnToString(dappPerDappBntAYear.div(dappToDappBntRate.div(10000)), {precision: 2}))
    // console.log('dappAPR', bnToString(dappBntAPR.div(dappToDappBntRate.div(10000)), {precision: 2}))

    const dappAPR = poolDappPerYear.mul(100).mul(100).div(totalDappStaked.value)
    // const dappAPR = poolDappPerYear.mul(100).mul(100).div(totalDappStaked.value)
    console.log('calculatePoolAPR poolId', pool.poolId, 'poolDappPerBlock', bnToString(poolDappPerBlock, {precision: 18}), 'poolDappPerYear', bnToString(poolDappPerYear, {precision: 18}), 'apr', bnToString(dappAPR, {precision: 2}))

    return {
        dappAPR: parseFloat(bnToString(dappAPR, {precision: 2})),
    }
}

const fetchPoolInfo = (contract, poolId) => async (dispatch, getState) => {
    const {distribution} = lmSelector(getState())

    try {
        const poolInfo = await contract.poolInfo(poolId)

        const pool = {
            poolId,
            timeLocked: poolInfo[1].toNumber(),
            totalDappStaked: bnToBnStringPair(poolInfo[4], {precision: 18, prettify: true}),
            totalDappBntStaked: bnToBnStringPair(poolInfo[5], {precision: 18, prettify: true}),
            totalLpStaked: bnToBnStringPair(poolInfo[6], {precision: 18, prettify: true}),

            allocPoint: bnToBnStringPair(poolInfo[0]),
            lastRewardBlock: bnToBnStringPair(poolInfo[2]),
            accDappPerShare: bnToBnStringPair(poolInfo[3]),
        }

        dispatch({
            type: 'LIQUIDITY_MINING.SET_POOL_INFO',
            payload: {
                [poolId]: {...pool, ...calculatePoolAPR(pool, distribution)},
            }
        })
    }
    catch (e) {
        dispatch(showNotification({type: 'error', text: 'Error fetching pools info'}))
    }
}

export const fetchPoolInfos = () => async (dispatch, getState) => {
    // return

    const state = getState()
    const {contract} = lmSelector(state)
    const dapp = tokenSelector('DAPP')(state)

    try {
        const dappPerBlock = await contract.dappPerBlock()
        const totalAllocPoint = await contract.totalAllocPoint()
        dispatch({
            type: 'LIQUIDITY_MINING.SET_DISTRIBUTION',
            payload: {
                dappPerBlock: bnToBnStringPair(dappPerBlock, dapp),
                totalAllocPoint: bnToBnStringPair(totalAllocPoint),
            },
        })

        _.forEach(POOLS, ({id}) => dispatch(fetchPoolInfo(contract, id)))
    }
    catch (e) {
        dispatch(showNotification({type: 'error', text: 'Error fetching pools info'}))
    }
}

const fetchLiquidityProtection = () => async (dispatch, getState) => {

    const state = getState()
    const {liquidityProtection} = lmSelector(state)
    const tokens = tokensSelector(state)

    if (_.isNil(liquidityProtection?.contract)) {
        return console.error('fetch liquidity protection failed - liquidityProtection contract is null')
    }

    try {
        const availableSpace = await liquidityProtection.contract.poolAvailableSpace(DAPPBNT_POOL_ADDRESS)

        dispatch({
            type: 'LIQUIDITY_MINING.SET_LIQUIDITY_PROTECTION',
            payload: {
                availableSpace: {
                    DAPP: bnToBnStringPair(availableSpace[0], {...tokens.DAPP, prettify: true}),
                    BNT: bnToBnStringPair(availableSpace[1], {...tokens.BNT, prettify: true}),
                },
            },
        })
    }
    catch (e) {

    }
}

export const fetchExistingPositions = () => async (dispatch, getState) => {
    const state = getState()
    const {liquidityProtection} = lmSelector(state)
    const account = accountSelector('ETH')(state)
    const tokens = tokensSelector(state)

    if (_.isNil(liquidityProtection?.storeContract)) {
        return console.error('fetchExistingPositions failed - liquidityProtection.storeContract is null')
    }

    try {
        const token = tokens.DAPP
        const {storeContract} = liquidityProtection
        const positionIds = await storeContract.connect(account.signer).protectedLiquidityIds(account.address)

        const positions = await Promise.all(
            _.map(positionIds, posId => storeContract.protectedLiquidity(posId))
        )

        dispatch({
            type: 'LIQUIDITY_MINING.SET_LIQUIDITY_PROTECTION',
            payload: {
                positions: _.map(positions, (p, i) => ({
                    positionId: positionIds[i],
                    poolTokenAmount: bnToBnStringPair(p[3], token),
                    reserveTokenAmount: bnToBnStringPair(p[4], tokens.BNT),
                    numerator: bnToBnStringPair(p[5], token),
                    denominator: bnToBnStringPair(p[6], token),
                })),
            },
        })
    }
    catch (e) {
        // dispatch(showNotification({type: 'error', text: _.get(e, 'data.message', e.message)}))
    }
}

export const fetchContractBntBalance = () => async (dispatch, getState) => {
    const state = getState()

    try {
        const bntToken = tokenSelector('BNT')(state)
        const balance = await fetchBalance({account: {address: STAKING_POOL_ADDRESS}})(bntToken)

        dispatch({
            type: 'LIQUIDITY_MINING.SET_CONTRACT_BNT_BALANCE',
            payload: balance,
        })
    }
    catch (e) {

    }
}

export const fetchLockedBntBalances = () => async (dispatch, getState) => {
    const state = getState()
    const {liquidityProtection} = lmSelector(state)

    if (_.isNil(liquidityProtection?.storeContract)) {
        return console.error('fetchLockedBntBalances failed - liquidityProtection.storeContract is null')
    }

    try {
        const {storeContract} = liquidityProtection
        const lockedBalancesCount = await storeContract.lockedBalanceCount(STAKING_POOL_ADDRESS)
        if (lockedBalancesCount.isZero()) return

        const endIndex = lockedBalancesCount

        dispatch({
            type: 'LIQUIDITY_MINING.SET_LOCKED_BNT_INFO',
            payload: {
                endIndex,
            },
        })
    }
    catch (e) {
        // dispatch(showNotification({type: 'error', text: _.get(e, 'data.message', e.message)}))
    }
}

const initLiquidityProtection = () => async (dispatch, getState) => {

    const state = getState()
    const chain = chainSelector('ETH')(state)

    if (_.isNil(chain?.provider)) {
        return console.error('init liquidity protection failed - provider is null')
    }

    try {
        const contract = new ethers.Contract(BANCOR_LIQUIDITY_PROTECTION_ADDRESS, liquidityProtectionAbi, chain.provider)
        const storeContract = new ethers.Contract(BANCOR_LIQUIDITY_PROTECTION_STORE_ADDRESS, liquidityProtectionStoreAbi, chain.provider)

        dispatch({
            type: 'LIQUIDITY_MINING.SET_LIQUIDITY_PROTECTION',
            payload: {
                contract,
                storeContract,
            },
        })

        dispatch(fetchLiquidityProtection())
    }
    catch {

    }
}

export const initLiquidityMining = () => async (dispatch, getState) => {

    const state = getState()
    const chain = chainSelector('ETH')(state)
    // const dapp = tokenSelector('DAPP')(state)

    if (_.isNil(chain?.provider)) {
        return console.error('init liquidity mining failed - user not connected')
    }
    try {
        const contract = new ethers.Contract(STAKING_POOL_ADDRESS, stakingPoolAbi, chain.provider)

        dispatch({
            type: 'LIQUIDITY_MINING.SET_CONTRACT',
            payload: contract,
        })

        dispatch(initLiquidityProtection())

        const userPoolTotalEntries = await Promise.all(
            _.map(POOLS, ({id: poolId}) => contract.userPoolTotalEntries(poolId))
        )

        dispatch({
            type: 'LIQUIDITY_MINING.SET_TOTAL_ENTRIES',
            payload: _.sumBy(userPoolTotalEntries, bn => bn.toNumber()),
        })
    }
    catch (e) {

    }
}

const fetchUserPoolInfo = (contract, account, poolId, blockTimestamp) => async (dispatch, getState) => {
    try {
        const userInfoRes = await contract.userPoolInfo(poolId, account.address)

        const userPoolInfo = {
            poolId,
            amount: bnToBnStringPair(userInfoRes[0], {precision: 4, prettify: true}),
            dappStaked: bnToBnStringPair(userInfoRes[1]),
            lpAmount: bnToBnStringPair(userInfoRes[2]),
            pending: bnToBnStringPair(userInfoRes[3]),
            rewardDebt: bnToBnStringPair(userInfoRes[4]),
            positionId: userInfoRes[5].toNumber(),
            depositTime: userInfoRes[6].toNumber(),
            // claimableBnt: bnToBnStringPair(BigNumber.from(poolId * 100)),
            claimableBnt: bnToBnStringPair(userInfoRes[7], {precision: 18, prettify: true}),
            bntLocked: userInfoRes[8].toNumber(),
        }

        if (userPoolInfo.amount.value.gt(0)) {
            const state = getState()
            if (userPoolInfo.depositTime > 0) {
                const {timeLocked} = poolSelector(poolId)(state)

                const ts = !_.isNil(blockTimestamp) ? blockTimestamp : await getBlockTimestamp(state)
                const secondsToUnlock = userPoolInfo.depositTime + timeLocked - ts
                userPoolInfo.unlocksAt = Date.now() + secondsToUnlock * 1000
                // userPoolInfo.unlocksAt = secondsToUnlock > 0 ? (Date.now() + secondsToUnlock * 1000) : null
            }
        }

        dispatch({
            type: 'LIQUIDITY_MINING.SET_USER_INFO',
            payload: {
                [poolId]: userPoolInfo,
            }
        })
    }
    catch (e) {
        dispatch(showNotification({type: 'error', text: 'Error fetching account liquidity info'}))
    }
}

const fetchPendingRewards = (contract, account, poolId) => async (dispatch, getState) => {
    // return

    try {
        const rewards = await contract.getPendingRewards(poolId, account.address)

        dispatch({
            type: 'LIQUIDITY_MINING.SET_USER_REWARDS',
            payload: {
                [poolId]: bnToBnStringPair(rewards),
            }
        })
    }
    catch (e) {
        dispatch(showNotification({type: 'error', text: 'Error fetching account rewards'}))
    }
}

export const fetchUserPoolRewards = () => async (dispatch, getState) => {
    const state = getState()
    const account = accountSelector('ETH')(state)

    if (_.isEmpty(account?.address)) return

    const {contract} = lmSelector(state)

    _.forEach(POOLS, ({id}) => {
        dispatch(fetchPendingRewards(contract, account, id))
    })
}

export const fetchUserPoolInfos = () => async (dispatch, getState) => {
    const state = getState()
    const account = accountSelector('ETH')(state)
    const {contract} = lmSelector(state)

    const blockTimestamp = await getBlockTimestamp(state)

    _.forEach(POOLS, ({id}) => {
        dispatch(fetchUserPoolInfo(contract, account, id, blockTimestamp))
    })

    dispatch(fetchUserPoolRewards())
}

export const connectLiquidityMining = () => async (dispatch, getState) => {

    const state = getState()
    const account = accountSelector('ETH')(state)

    if (_.isNil(account.signer)) {
        return console.error('init liquidity mining failed - user not connected')
    }

    const contract = new ethers.Contract(STAKING_POOL_ADDRESS, stakingPoolAbi, account.signer)

    contract.on('PositionTransferred', (newId, providerAddress, event) => {
        console.log('PositionTransferred', {newId, providerAddress, event})
        if (providerAddress === account.address) {
            dispatch(fetchUserPoolInfos())
        }
    })

    // const dappBntPoolAnchor = await contract.dappBntPoolAnchor()
    // console.log('dappBntPoolAnchor', bnToBnStringPair(dappBntPoolAnchor))

    // const dappPerBlock = await contract.dappPerBlock()
    // console.log('dappPerBlock', bnToBnStringPair(dappPerBlock))

    // const dappRewardsSupply = await contract.dappRewardsSupply()
    // console.log('dappRewardsSupply', bnToBnStringPair(dappRewardsSupply))

    dispatch({
        type: 'LIQUIDITY_MINING.SET_CONTRACT',
        payload: contract
    })

    const liquidityProtectionContract = new ethers.Contract(BANCOR_LIQUIDITY_PROTECTION_ADDRESS, liquidityProtectionAbi, account.signer)
    const storeContract = new ethers.Contract(BANCOR_LIQUIDITY_PROTECTION_STORE_ADDRESS, liquidityProtectionStoreAbi, account.signer)

    dispatch({
        type: 'LIQUIDITY_MINING.SET_LIQUIDITY_PROTECTION',
        payload: {
            contract: liquidityProtectionContract,
            storeContract,
        },
    })
}

export const stake = (token, amount, poolId, infiniteApproval) => async (dispatch, getState) => {
    dispatch(setActionPending("change-liquidity"))
    const state = getState()
    const {contract} = lmSelector(state)

    if (_.isNil(contract.signer)) {
        return console.error('stakeDAPP failed - user not connected')
    }

    const account = accountSelector('ETH')(state)

    try {
        let _amount = amount

        if (_.isString(amount)) {
            _amount = ethers.utils.parseUnits(amount, token.precision)
        }

        await checkAndApproveAllowance(account, STAKING_POOL_ADDRESS, token, _amount, infiniteApproval)

        const stakeTx = await (token.symbol === 'DAPP' ? contract.stakeDapp(_amount, poolId) : contract.stakeDappBnt(_amount, poolId))
        console.log("stakeTx", stakeTx);
        const stakeReceipt = await stakeTx.wait()
        console.log("stakeReceipt", stakeReceipt);

        dispatch(showNotification({type: 'success', text: 'Liquidity Added'}))
        dispatch(fetchUserPoolInfo(contract, account, poolId))
        dispatch(fetchPoolInfo(contract, poolId))
    } catch (e) {
        dispatch(showNotification({type: 'error', text: _.get(e, 'data.message', e.message)}))
    }

    dispatch(clearActionStatus("change-liquidity"))
}

export const unstake = (token, {amount, portionPPM}, poolId) => async (dispatch, getState) => {
    dispatch(setActionPending("change-liquidity"))
    const state = getState()
    const {contract} = lmSelector(state)

    if (_.isNil(contract.signer)) {
        return console.error('unstake failed - user not connected')
    }

    const account = accountSelector('ETH')(state)

    try {
        const tx = await (token.symbol === 'DAPP' ? contract.unstakeDapp(poolId) : contract.unstakeDappBnt(ethers.utils.parseUnits(amount, token.precision), poolId))
        // const tx = await (token.symbol === 'DAPP' ? contract.unstakeDapp(portionPPM, poolId) : contract.unstakeDappBnt(ethers.utils.parseUnits(amount, token.precision), poolId))
        console.log("tx", tx);
        const receipt = await tx.wait()
        console.log("receipt", receipt);

        dispatch(showNotification({type: 'success', text: 'Liquidity Removed'}))
        dispatch(fetchUserPoolInfo(contract, account, poolId))
        dispatch(fetchPoolInfo(contract, poolId))
    } catch (e) {
        dispatch(showNotification({type: 'error', text: _.get(e, 'data.message', e.message)}))
    }
    dispatch(clearActionStatus('change-liquidity'))
}

export const updateRewards = (poolId) => async (dispatch, getState) => {
    const actionKey = `update-rewards-${poolId}`
    dispatch(setActionPending(actionKey))

    const state = getState()
    const {contract} = lmSelector(state)

    if (_.isNil(contract.signer)) {
        return console.error('updateRewards failed - user not connected')
    }

    try {
        const tx = await contract.updateRewards(poolId)
        const receipt = await tx.wait()

        dispatch(showNotification({type: 'success', text: 'Rewards Updated'}))
        dispatch(fetchUserPoolRewards())
    } catch (e) {
        dispatch(showNotification({type: 'error', text: _.get(e, 'data.message', e.message)}))
    }

    dispatch(clearActionStatus(actionKey))
}

export const claimRewards = (poolId) => async (dispatch, getState) => {
    const actionKey = `claim-rewards-${poolId}`
    dispatch(setActionPending(actionKey))

    const state = getState()
    const {contract} = lmSelector(state)

    if (_.isNil(contract.signer)) {
        return console.error('claimRewards failed - user not connected')
    }

    try {
        const tx = await contract.harvest(poolId)
        const receipt = await tx.wait()

        dispatch(showNotification({type: 'success', text: 'Rewards Claimed'}))
        dispatch(fetchUserPoolRewards())
    } catch (e) {
        dispatch(showNotification({type: 'error', text: _.get(e, 'data.message', e.message)}))
    }

    dispatch(clearActionStatus(actionKey))
}

export const claimContractBnt = () => async (dispatch, getState) => {
    const actionKey = `claim-bnt`
    dispatch(setActionPending(actionKey))

    const state = getState()
    const {contract, lockedBntInfo} = lmSelector(state)


    try {
        const tx = await contract.claimBnt(lockedBntInfo.endIndex)
        const receipt = await tx.wait()

        dispatch(showNotification({type: 'success', text: 'Contract BNT Claimed'}))
        dispatch(fetchUserPoolInfos())
        dispatch(fetchLockedBntBalances())
        dispatch(fetchContractBntBalance())
    } catch (e) {
        dispatch(showNotification({type: 'error', text: _.get(e, 'data.message', e.message)}))
    }

    dispatch(clearActionStatus(actionKey))
}

export const claimUserBnt = poolId => async (dispatch, getState) => {
    const actionKey = `claim-user-bnt-${poolId}`
    dispatch(setActionPending(actionKey))

    const state = getState()
    const {contract} = lmSelector(state)

    if (_.isNil(contract.signer)) {
        return console.error('claimRewards failed - user not connected')
    }

    try {
        const tx = await contract.claimUserBnt(poolId)
        const receipt = await tx.wait()

        dispatch(showNotification({type: 'success', text: 'BNT Claimed'}))
        dispatch(fetchUserPoolInfos())
    } catch (e) {
        dispatch(showNotification({type: 'error', text: _.get(e, 'data.message', e.message)}))
    }

    dispatch(clearActionStatus(actionKey))
}

export const transferPosition = (positionId, poolId) => async (dispatch, getState) => {
    const actionKey = `transfer-position`
    dispatch(setActionPending(actionKey))

    const state = getState()
    const {contract} =  _.get(state, 'liquidityMining.liquidityProtection')
    const account = accountSelector('ETH')(state)

    try {
        const pid = ethers.utils.defaultAbiCoder.encode(['uint256'], [poolId])

        const tx = await contract.connect(account.signer).transferPositionAndNotify(positionId, STAKING_POOL_ADDRESS, STAKING_POOL_ADDRESS, pid)
        const txReceipt = await tx.wait()

        dispatch(fetchExistingPositions())
        dispatch(fetchUserPoolInfo(contract, account, poolId))
        dispatch(fetchPoolInfo(contract, poolId))
        dispatch(showNotification({type: 'success', text: 'Position Transferred'}))
    }
    catch (e) {
        dispatch(showNotification({type: 'error', text: _.get(e, 'data.message', e.message)}))
    }

    dispatch(clearActionStatus(actionKey))
}

// TEMP FOR TESTING
export const testAddSingleSidedDapp = amount => async (dispatch, getState) => {
    const actionKey = `change-liquidity`
    dispatch(setActionPending(actionKey))

    const state = getState()
    const {contract} =  _.get(state, 'liquidityMining.liquidityProtection')
    const account = accountSelector('ETH')(state)
    const tokens = tokensSelector(state)

    const token = tokens.DAPP

    try {
        const {addresses} = token

        const _amount = ethers.utils.parseUnits(amount, 18)

        await checkAndApproveAllowance(account, BANCOR_LIQUIDITY_PROTECTION_ADDRESS, token, _amount)

        const tx = await contract.connect(account.signer).addLiquidity(DAPPBNT_POOL_ADDRESS, addresses.ETH, _amount)
        console.log('testAddSingleSidedDapp tx', tx)
        const txReceipt = await tx.wait()
        console.log('testAddSingleSidedDapp txReceipt', txReceipt)

        dispatch(fetchExistingPositions())
        dispatch(showNotification({type: 'success', text: 'Liquidity Added'}))
    }
    catch (e) {
        dispatch(showNotification({type: 'error', text: _.get(e, 'data.message', e.message)}))
    }

    dispatch(clearActionStatus(actionKey))
}

// SELECTORS
export const lmSelector = state => _.get(state, 'liquidityMining')

export const userPositionSelector = poolId => state => _.get(state, ['liquidityMining', 'userInfo', poolId + ''], {})

export const poolSelector = poolId => state => _.get(state, ['liquidityMining', 'pools', poolId + ''])

export const userStakedPoolsSelector = state => {
    const {userInfo} = lmSelector(state)
    return _.filter(userInfo, ui => ui.amount.value.gt(0) || ui.lpAmount.value.gt(0) || ui.pending.value.gt(0))
}

export const pendingRewardsSelector = state => {
    const {userRewards} = lmSelector(state)
    const stakedPools = userStakedPoolsSelector(state)
    const poolIds = _.map(stakedPools, 'poolId')
    return _.pick(userRewards, poolIds)
}

export const claimableBntSelector = state => {
    const {userInfo, contractBntBalance} = lmSelector(state)

    if (_.isNil(contractBntBalance)) return {}
    const claimablePools = _.filter(userInfo, ui => ui.claimableBnt.value.gt(0))
    if (_.isEmpty(claimablePools)) return {}

    const claimableBntPools = _.map(claimablePools, ({poolId, claimableBnt, bntLocked}) => ({
        poolId,
        contractClaimRequired: contractBntBalance.lt(claimableBnt.value),
        amountStr: claimableBnt.str,
        expirationTime: bntLocked,
        isLocked: bntLocked > (new Date()).getTime(),
    }))

    return {
        claimableBntPools,
        contractClaimAvailable: _.some(claimableBntPools, ({contractClaimRequired, isLocked}) => contractClaimRequired && !isLocked),
    }
}

export const userAggSelector = state => {
    const {userInfo, userRewards} = lmSelector(state)

    return _.reduce(userInfo, (agg, ui, pid) => {
        const rewards = _.has(userRewards, pid) ? userRewards[pid].value : BigNumber.from(0)
        return {
            totalDappStaked: agg.totalDappStaked.add(ui.dappStaked.value),
            totalDappBntStaked: agg.totalDappBntStaked.add(ui.lpAmount.value),
            pendingRewards: agg.pendingRewards.add(rewards),
        }
    }, {
        totalDappStaked: BigNumber.from(0),
        totalDappBntStaked: BigNumber.from(0),
        pendingRewards: BigNumber.from(0),
    })
}

const INITIAL_STATE = {
    contract: null,
    pools: [],
    userInfo: {},
    userRewards: {},
    liquidityProtection: {},
    distribution: {
        dappPerBlock: null,
        totalAllocPoint: null,
    },
    userPoolTotalEntries: null,
    lockedBntInfo: {},
    contractBntBalance: null,
}

export const liquidityMiningReducer = makeReducer({
    'LIQUIDITY_MINING.INIT': reduceUpdateFull,
    'LIQUIDITY_MINING.SET_CONTRACT': reduceSetKey('contract'),
    'LIQUIDITY_MINING.SET_POOL_INFO': reduceUpdateKey('pools'),
    'LIQUIDITY_MINING.SET_USER_INFO': reduceUpdateKey('userInfo'),
    'LIQUIDITY_MINING.SET_USER_REWARDS': reduceUpdateKey('userRewards'),
    'LIQUIDITY_MINING.SET_LIQUIDITY_PROTECTION': reduceUpdateKey('liquidityProtection'),
    'LIQUIDITY_MINING.SET_DISTRIBUTION': reduceUpdateKey('distribution'),
    'LIQUIDITY_MINING.SET_TOTAL_ENTRIES': reduceSetKey('userPoolTotalEntries'),
    'LIQUIDITY_MINING.SET_LOCKED_BNT_INFO': reduceSetKey('lockedBntInfo'),
    'LIQUIDITY_MINING.SET_CONTRACT_BNT_BALANCE': reduceSetKey('contractBntBalance'),
}, INITIAL_STATE)

