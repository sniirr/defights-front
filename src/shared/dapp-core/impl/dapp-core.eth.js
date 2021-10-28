import _ from "lodash";
import tokenAbi from 'shared/dapp-common/utils/tokenAbi'
import { ethers } from "ethers"

export const init = ({chains, tokens}) => {
    if (!window.ethereum) {
        throw 'Metamask not found, please install the extension and refresh to proceed'
    }
    const provider = new ethers.providers.Web3Provider(window.ethereum, "any");

    return {
        chains: {
            ...chains,
            ETH: {
                ..._.get(chains, 'ETH', {}),
                provider,
            }
        },
        tokens: _.mapValues(tokens, token => ({
            ...token,
            contracts: {
                ..._.get(token, 'contracts', {}),
                ETH: new ethers.Contract(token.addresses.ETH, tokenAbi, provider),
            }
        }))
    }
}

export const connect = ({chain}, {dispatch}) => async ({providerIdx}, tokens, fetchBalance) => {
    const {ethereum} = window;
    const {chainId: currChainId} = ethereum;

    const {chainInfo, provider, name: chainName} = chain

    if (currChainId === chainInfo.chainId) {
        if (!!ethereum) {
            await provider.send("eth_requestAccounts", []);
            const signer = provider.getSigner();
            const address = await signer.getAddress()

            _.forEach(tokens, async token => {
                // const {symbol} = token
                const tokenContract = token.contracts.ETH
                await tokenContract.connect(signer)

                tokenContract.removeAllListeners()

                tokenContract.on('Transfer', (from, to, amount, event) => {
                    if (from === address || to === address) {
                        fetchBalance('ETH', token)
                        dispatch({
                            type: 'TOKEN.ON_TRANSFER',
                            meta: {isTrigger: true},
                            payload: {token, from, to, amount, event},
                        })
                    }
                })
                tokenContract.on('Approval', (owner, spender, amount, event) => {
                    if (owner === address) {
                        dispatch({
                            type: 'TOKEN.ON_APPROVAL',
                            meta: {isTrigger: true},
                            payload: {token, owner, spender, amount, event},
                        })
                    }
                })
            })

            return {
                address,
                signer,
            }
        }
    } else {
        throw {message: "Wrong network, please connect to " + chainName}
    }
    return null
}

export const checkAndApproveAllowance = async (account, spender, token, amount, infiniteApproval) => {
    const {contracts: tokenContracts} = token

    const tokenContract = tokenContracts.ETH

    const tContract = await tokenContract.connect(account.signer)

    const allowance = await tContract.allowance(account.address, spender)

    if (allowance.lt(amount)) {
        const _amount = infiniteApproval ? ethers.utils.parseUnits("10000000000000000", token.precision) : amount
        const approveTx = await tContract.approve(spender, _amount)
        console.log("approveTx", approveTx);
        const approveReceipt = await approveTx.wait()
        console.log("approveReceipt", approveReceipt);
    }
}

export const fetchBalance = ({account}) => async ({precision, contracts}) => {
    const contract = _.get(contracts, 'ETH')

    if (_.isNil(contract)) return

    return await contract.balanceOf(account.address)
}

const logout = () => async () => {}

export default {
    init,

    connect,
    logout,
    fetchBalance,
}