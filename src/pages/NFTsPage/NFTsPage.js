import React, {useEffect} from 'react'
import _ from 'lodash'
import numeral from 'numeral'
import './NFTsPage.scss'
import classNames from "classnames";
import HeroImage from 'components/HeroImage'
import {useSelector} from "react-redux";
import {guildIdSelector} from "store/game"
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome'
import {faShieldAlt, faTrophy, faClock, faBullseye} from '@fortawesome/free-solid-svg-icons'

const SLOTS = {
    Outfit: 0,
    Power: 1,
    Gadget: 2,
    Accessory: 3,
}

const COLORS = {
    Purple: 0,
    White: 1,
    Green: 2,
    Orange: 3,
    Black: 4,
}

const BONUS_TYPES = {
    SimpleBonus: 0,
    VictoryBonus: 1,
    NFT_Bonus: 2,
    Attack: 3,
    Defense: 4,
    Special: 5,
    AffinityAndLevel: 6,
}

const RARITIES = {
    Common: 0,
    Rare: 1,
    Epic: 2,
    Legendary: 3,
}

const equippedItems = {
    [SLOTS.Outfit]: {
        id: '0',
        slot: SLOTS.Outfit,
        name: 'Justified Ends',
        color: COLORS.Black,
        bonus_type: BONUS_TYPES.VictoryBonus,
        vars: [20, 5],
        description: '+[[0]]% if Black wins season, -[[1]]% if Black loses',
        rarity: RARITIES.Epic,
        affinity: 1.2,

        consumable: false,
        temporary: true,
    },
    [SLOTS.Power]: {
        id: '1',
        slot: SLOTS.Power,
        name: 'Strike Silent',
        color: COLORS.White,
        bonus_type: BONUS_TYPES.Attack,
        vars: [24],
        description: 'Target cannot use (and cannot un-equip) attacks for [[0]] hours',
        rarity: RARITIES.Common,
        affinity: 1.2,

        consumable: false,
        temporary: false,
    },
    [SLOTS.Gadget]: {},
    [SLOTS.Accessory]: {
        id: '2',
        slot: SLOTS.Accessory,
        name: 'IQ Implants',
        color: COLORS.Purple,
        bonus_type: BONUS_TYPES.Defense,
        vars: [15],
        description: '[[0]]% chance of defending against attack',
        rarity: RARITIES.Legendary,
        affinity: 1.2,

        consumable: false,
        temporary: false,
    },
}

const BONUS_TYPE_ICONS = {
    [BONUS_TYPES.SimpleBonus]: ['Bonus', faShieldAlt],
    [BONUS_TYPES.VictoryBonus]: ['Victory Bonus', faTrophy],
    [BONUS_TYPES.NFT_Bonus]: ['NFT Bonus', faShieldAlt],
    [BONUS_TYPES.Attack]: ['Attack Bonus', faBullseye],
    [BONUS_TYPES.Defense]: ['Defense Bonus', faShieldAlt],
    [BONUS_TYPES.Special]: ['Special Bonus', faShieldAlt],
    [BONUS_TYPES.AffinityAndLevel]: ['Affinity & Level Bonus', faShieldAlt],
}

const NFTCard = ({name, color, bonus_type, vars, description, rarity, affinity, consumable, temporary}) => {

    const guildId = useSelector(guildIdSelector)
    const isEquipped = !_.isEmpty(name)

    const boosted = guildId === color

    const desc = _.reduce(vars, (desc, v, i) => {
        return desc.replace(`[[${i}]]`, boosted ? `<span class="boosted" title="1.2x affinity bonus">${numeral(v * affinity).format('0,0.[00]')}</span>` : v)
    }, description)

    const [bonusTitle, bonusIcon] = _.get(BONUS_TYPE_ICONS, bonus_type, ['', null])

    return (
        <div className={classNames("nft-card", `rarity-${rarity}`)}>
            <div className="bg"/>
            <div className={classNames("card", !isEquipped && "empty")}>
                {isEquipped ? (
                    <>
                        <div className="center-aligned-row header">
                            <div/>
                            <div className="name">{name}</div>
                            {temporary && <FontAwesomeIcon icon={faClock} title="Expires at 15.05.21 10:30"/>}
                            {isEquipped && <div className={classNames("item-color", `guild-${color}`)}/>}
                        </div>
                        <div className="card-main">

                        </div>
                        <div className="center-aligned-row footer">
                            <FontAwesomeIcon icon={bonusIcon} title={bonusTitle}/>
                            <span className="description" dangerouslySetInnerHTML={{__html: desc}}/>
                        </div>
                    </>
                ) : (
                    <div className="">Not Equipped</div>
                )}
            </div>
        </div>
    )
}

const NFTsPage = () => {
    return (
        <div className="page nfts">
            <div className="page-inner">
                <div className="">
                    <h1>Superpower NFTs</h1>
                </div>
                <div className="hero-sbs">
                    <div className="hero-view">
                        {/*<HeroImage/>*/}
                    </div>
                    <div className="hero-props">
                        <div className="nft-slot">
                            <div className="nft-groupname">Outfit</div>
                            <NFTCard {...equippedItems[SLOTS.Outfit]}/>
                        </div>
                        <div className="nft-slot">
                            <div className="nft-groupname">Power</div>
                            <NFTCard {...equippedItems[SLOTS.Power]}/>
                        </div>
                        <div className="nft-slot">
                            <div className="nft-groupname">Gadget</div>
                            <NFTCard {...equippedItems[SLOTS.Gadget]}/>
                        </div>
                        <div className="nft-slot">
                            <div className="nft-groupname">Accessory</div>
                            <NFTCard {...equippedItems[SLOTS.Accessory]}/>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default NFTsPage