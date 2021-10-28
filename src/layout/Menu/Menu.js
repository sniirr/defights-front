import React from 'react'
import _ from 'lodash'
import {useDispatch, useSelector} from "react-redux";
import {NavLink} from "react-router-dom"
import classNames from "classnames";
import {toggleMenu} from "store/uiReducer";
import './Menu.scss'

const MENU_ITEMS = [
    {text: 'DeFights', path: '/'},
    {text: 'My Dashboard', path: '/dashboard'},
    {text: 'DAPP Pools', path: '/pools'},
    {text: 'DAPP Bridge', path: '/bridge'},
    // {text: 'Superpower NFTs', path: '/nfts'},
    {text: 'Story', path: '/story'},
    {text: 'FAQ', path: '/faq'},
]

const Menu = () => {

    const dispatch = useDispatch()
    const isMenuVisible = useSelector(state => _.get(state, 'ui.menuOpen'))

    return (
        <div className={classNames("menu", {visible: isMenuVisible})}>
            <div className="menu-backdrop" onClick={() => dispatch(toggleMenu())}/>
            <div className="menu-items">
                {_.map(MENU_ITEMS, ({text, path}, i) => (
                    <NavLink key={`menu-item-${_.kebabCase(text)}`} to={path} exact className="menu-item" activeClassName="active" onClick={() => dispatch(toggleMenu())}>
                        <div className="dot"/>{text}
                    </NavLink>
                ))}
            </div>
        </div>
    );
}

export default Menu
