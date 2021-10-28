import React from 'react'
import './DashboardHeader.scss'
import {useDispatch, useSelector} from "react-redux";
import _ from "lodash";
import {MenuItem, Select} from "@material-ui/core";
import {characterSelector, updateCharacter} from "store/game";
import {useHistory} from "react-router-dom";
import {showModal} from "shared/dapp-common/components/Modal";
import {TEAMS, GENDERS, BUILDS, SKIN_TONES} from "consts"

const DashboardHeader = () => {

    let history = useHistory()
    const dispatch = useDispatch()
    const character = useSelector(characterSelector)

    const {name, gender, build, tone, team: guildId} = character

    return (
        <div className="dashboard-header">
            <div className="hero-name">{name}</div>
            <div className="center-aligned-spaced-row">
                <div className="hero-props">
                    <div className="prop-row">
                        <div className="cell">Guild</div>
                        <div className="cell guild-cell">
                            {/*{_.toUpper(TEAMS[guildId]?.text)}*/}
                            <div className="guild-select">
                                <Select
                                    labelId="demo-simple-select-label"
                                    id="demo-simple-select"
                                    value={guildId}
                                    onChange={e => dispatch(updateCharacter({team: e.target.value}))}
                                >
                                    <MenuItem value={-1}>No Guild</MenuItem>
                                    {_.map(TEAMS, ({text}, i) => (
                                        <MenuItem key={`guild-selection-item-${i}`} value={i}>{text}</MenuItem>
                                    ))}
                                </Select>
                            </div>
                        </div>
                    </div>
                    <div className="prop-row">
                        <div className="cell">Appearance</div>
                        <div
                            className="cell">{GENDERS[gender].label}, {BUILDS[build].label}, {SKIN_TONES[tone].label}</div>
                        <div className="plain-button"
                             onClick={() => dispatch(showModal('hero-props', {character}))}>Change Appearance
                        </div>
                    </div>
                    <div className="prop-row" style={{display: 'none'}}>
                        <div className="cell">Equipment</div>
                        <div className="cell">Not Equipped</div>
                        <div className="plain-button" onClick={() => history.push('/nfts')}>Equip Hero</div>
                    </div>
                </div>
                <div className="hero-image"/>
            </div>
        </div>
    )
}

export default DashboardHeader