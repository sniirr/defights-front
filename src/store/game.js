import _ from 'lodash'
import {makeReducer, reduceUpdateKey} from "shared/dapp-common/utils/reduxUtils";

function getRandomInt(max) {
    return Math.floor(Math.random() * max);
}

export const updateCharacter = account => dispatch => {
    localStorage.setItem('defights_char', JSON.stringify(account))
    dispatch({
        type: 'GAME.UPDATE_CHARACTER',
        payload: account,
    })
}

export const guildIdSelector = state => _.get(state, 'game.character.team', -1)
export const characterSelector = state => _.get(state, 'game.character', {})

const character = localStorage.getItem('defights_char')
const INITIAL_STATE = {
    character: {
        team: -1,
        name: 'My Hero',
        gender: 0,
        build: 1,
        tone: 1,
        ...(!_.isEmpty(character) ? JSON.parse(character) : {
            team: getRandomInt(5)
        })
    },
}

export const gameReducer = makeReducer({
    'GAME.UPDATE_CHARACTER': reduceUpdateKey('character'),
}, INITIAL_STATE)