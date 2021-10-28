import React from 'react'
import {useSelector} from "react-redux";
import _ from "lodash";
import {TEAMS, GENDERS, BUILDS, SKIN_TONES} from "consts"
import {characterSelector} from "store/game";

const HeroImage = () => {

    const character = useSelector(characterSelector)

    const {name, gender, build: bodyBuild, tone: skinTone, team: teamIdx} = character
    const {text: teamName} = _.get(TEAMS, teamIdx, {})

    const src = gender === 'male' ? '/images/hero-male.png' : '/images/hero-female.png'

    return (
        <img src={src} alt="Hero Image"/>
    )
}

export default HeroImage