import React from 'react'
import _ from 'lodash'
import {useDispatch} from "react-redux";
import Modal, {hideModal} from "shared/dapp-common/components/Modal"
import Button from "components/Button";
import './GuildSelectModal.scss'
import {updateCharacter} from "store/game";
import {TEAMS} from "consts"
import { Carousel } from 'react-responsive-carousel'
import classNames from "classnames";

const GuildSelectModal = ({guildId}) => {

    const dispatch = useDispatch()

    return (
        <Modal className="guild-select-modal">
            <Carousel autoPlay={false} interval={300000} infiniteLoop={false}
                      showArrows={false} showStatus={false} showIndicators={false}
                      showThumbs={false} centerMode centerSlidePercentage={83} selectedItem={guildId}>

            {_.map(TEAMS, ({text, words, description}, i) => {
                const heroClassName = `hero-${i}-0-1-1`
                return (
                    <div key={`guild-select-slide-${i}`} className={classNames("guild-info", `guild-${i}`, heroClassName)}>
                        <div className="guild-title">{text}</div>
                        <div className="content-row">
                            <div className="hero-image"/>
                            <div className="info-column">
                                <div>
                                    <div className="guild-color-text guild-words">{_.toUpper(words)}</div>
                                    <div className="guild-desc">{description}</div>
                                </div>
                                <Button className="button-full themed" onClick={() => {
                                    dispatch(updateCharacter({team: i}))
                                    dispatch(hideModal())
                                }}>Choose</Button>
                            </div>
                        </div>
                    </div>
                )
            })}
            </Carousel>
        </Modal>
    )
}

export default GuildSelectModal
