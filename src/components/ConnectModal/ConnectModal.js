import React from 'react'
import _ from 'lodash'
import {useDispatch, useSelector} from "react-redux";
import Modal, {hideModal} from "shared/dapp-common/components/Modal"
import {questionMarkIcon} from 'images'
import './ConnectModal.scss'
import metamaskIcon from 'shared/dapp-common/components/ConnectModal/images/metamask.svg'
import walletConnectIcon from 'shared/dapp-common/components/ConnectModal/images/walletconnect.svg'
import scatterIcon from 'shared/dapp-common/components/ConnectModal/images/scatter.svg'
import anchorIcon from 'shared/dapp-common/components/ConnectModal/images/anchor.svg'
import tokenPocketIcon from 'shared/dapp-common/components/ConnectModal/images/tokenpocket.svg'
import {ctrlSelector} from "shared/dapp-core";

const WALLETS = {
    ETH: [
        {text: 'MetaMask', icon: metamaskIcon},
        {text: 'WalletConnect', icon: walletConnectIcon},
    ],
    EOS: [
        {text: 'Scatter', icon: scatterIcon},
        {text: 'Anchor', icon: anchorIcon},
        {text: 'TokenPocket', icon: tokenPocketIcon},
    ]
}

const ConnectModal = ({activeChains}) => {

    const chainKey = activeChains[0]
    const dispatch = useDispatch()
    const controller = useSelector(ctrlSelector('core'))

    const closeModal = () => dispatch(hideModal())

    return (
        <Modal className="connect-modal" close={closeModal} title="Connect to a Wallet">
            <div>Please choose a wallet to connect to</div>
            <div className="wallet-buttons">
                {_.map(WALLETS[chainKey], ({text, icon}, i) => {
                    return (
                        <div key={`connect-wallet-btn-${i}`} className="center-aligned-spaced-row button-custom"
                                onClick={() => {
                                    controller.connect(chainKey, {providerIdx: i})
                                    closeModal()
                                }}>
                            {text}
                            <img src={icon} alt=""/>
                        </div>
                    )
                })}
            </div>
            <div className="center-aligned-row">
                <img src={questionMarkIcon} alt=""/>
                What is a wallet and how do I create one?
            </div>
        </Modal>
    )
}

export default ConnectModal
