import React, {useEffect} from 'react'
import 'rc-slider/assets/index.css';
import "react-responsive-carousel/lib/styles/carousel.min.css"
import 'css/guilds.scss';
import 'css/main.scss';
import {useDispatch, useSelector} from "react-redux";
import {BrowserRouter as Router} from "react-router-dom"
import Pages from 'pages'
import {Modals} from "shared/dapp-common/components/Modal";
import classNames from "classnames";
import {characterSelector} from "store/game"
import Header from "layout/Header";
import Menu from "layout/Menu";
import ConnectModal from "components/ConnectModal"
import HeroPropsModal from "components/HeroPropsModal"
import GuildSelectModal from "components/GuildSelectModal";
import LiquidityModal from 'components/LiquidityModal'
import RewardsModal from 'components/RewardsModal'
import Notification from "shared/dapp-common/components/Notification"
import useOnLogin from "shared/dapp-common/hooks/useOnLogin";
import {ctrlSelector, tokenSelector} from "shared/dapp-core";
import {
    connectLiquidityMining,
    fetchExistingPositions,
    fetchPoolInfos,
    fetchUserPoolInfos,
    initLiquidityMining
} from "store/liquidityMining";
import {poll} from "shared/dapp-common/utils/utils";
import {CreatePositionModal, TransferPositionModal} from "components/LiquidityModal/LiquidityModal";

const modals = {
    'connect': <ConnectModal/>,
    'hero-props': <HeroPropsModal/>,
    'guild-select': <GuildSelectModal/>,
    'liquidity': <LiquidityModal/>,
    'transfer-position': <TransferPositionModal/>,
    'rewards': <RewardsModal/>,

    'create-pos': <CreatePositionModal/>
}

const App = () => {

    const dispatch = useDispatch()

    const coreController = useSelector(ctrlSelector('core'))
    const token = useSelector(tokenSelector('DAPP'))
    const dappBntToken = useSelector(tokenSelector('DAPPBNT'))

    const {gender, build, tone, team: guildId} = useSelector(characterSelector)
    const heroClassName = `hero-${guildId}-${gender}-${build}-${tone}`

    useEffect(() => {
        dispatch(initLiquidityMining())
        setTimeout(() => coreController.connect('ETH'), 1500)

        poll({
            interval: 15000,
            pollFunc: () => {
                dispatch(fetchPoolInfos())
            },
        })
    }, [])

    useOnLogin('ETH', async () => {
        dispatch(await connectLiquidityMining())
        coreController.fetchBalance('ETH', token)
        coreController.fetchBalance('ETH', dappBntToken)
        dispatch(fetchUserPoolInfos())
        dispatch(fetchExistingPositions())
    })

    return (
        <div className={classNames("App", guildId > -1 && `guild-${guildId}`, heroClassName)}>
            <Router>
                <Menu/>
                <div className="page-container">
                    <Header/>
                    <main>
                        <Pages/>
                    </main>
                </div>
                <Modals modals={modals}/>
            </Router>
            <Notification/>
        </div>
    );
}

export default App
