import React from 'react'
import './Wheel.scss'
import classNames from "classnames";
import {guildIdSelector, updateCharacter} from "store/game"
import {useDispatch, useSelector} from "react-redux";
import {showModal} from "shared/dapp-common/components/Modal";

const Triangle = ({guildId, color, guildName}) => {
    const dispatch = useDispatch()
    const selectedGuildId = useSelector(guildIdSelector)

    const onGuildClick = () => {
        if (window.IS_MOBILE) {
            dispatch(showModal('guild-select', {guildId}))
        }
        else {
            dispatch(updateCharacter({team: guildId}))
        }
    }

    const heroClassName = `hero-${guildId}-0-1-1`

    return (
        <>
            <div className={classNames("triangle", color, heroClassName)} onClick={onGuildClick}>
                <div className={classNames("image", {selected: selectedGuildId === guildId})}/>
            </div>
            <div className={classNames("guild-name", color)}>{guildName}</div>
        </>
    )
}

const Wheel = () => {
    return (
        <div className="polygon">
            <div className="middle-point">
                <Triangle guildId={0} color="yellow" guildName="PINNACLE"/>
                <Triangle guildId={1} color="green" guildName="VERDANT"/>
                <Triangle guildId={2} color="black" guildName="AEGIS"/>
                <Triangle guildId={3} color="blue" guildName="THE ACADEMY"/>
                <Triangle guildId={4} color="orange" guildName="IGNITE"/>
            </div>
        </div>
    )
}

export default Wheel