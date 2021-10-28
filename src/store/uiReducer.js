import {makeReducer} from "shared/dapp-common/utils/reduxUtils";

export const toggleMenu = () => ({
    type: 'MENU.TOGGLE'
})

export const uiReducer = makeReducer({
    'MENU.TOGGLE': state => ({
        ...state,
        menuOpen: !state.menuOpen,
    }),
}, {
    menuOpen: false,
})