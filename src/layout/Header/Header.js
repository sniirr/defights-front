import React from 'react'
import _ from 'lodash'
import {useDispatch, useSelector} from "react-redux";
import {useHistory} from "react-router-dom"
import {showModal} from "shared/dapp-common/components/Modal"
import {menuIcon} from "images";
import SVG from "components/SVG";
import {toggleMenu} from "store/uiReducer";
import './Header.scss'
import {accountSelector, ctrlSelector} from "shared/dapp-core";

const Header = () => {

    let history = useHistory()
    const dispatch = useDispatch()

    const coreCtrl = useSelector(ctrlSelector('core'))
    const account = useSelector(accountSelector('ETH'))

    return (
        <header>
            <div className="logo" onClick={() => history.push('/')}>
                <span className="text-red">De</span>Fights
            </div>
            <div className="center-aligned-row">
                {_.isEmpty(account) ? (
                    <div className="button themed" onClick={() => dispatch(showModal('connect', {activeChains: ['ETH', 'EOS']}))}>
                        <div className="button-content">Connect Wallet</div>
                    </div>
                ) : (
                    <div className="logout truncate" title="Logout" onClick={() => coreCtrl.logout('ETH')}>{account.address}</div>
                )}
                <SVG className="menu-button" src={menuIcon} onClick={() => dispatch(toggleMenu())}/>
            </div>
        </header>
    );
}

export default Header
