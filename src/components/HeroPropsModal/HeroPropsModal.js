import React, {useState} from 'react'
import _ from 'lodash'
import {useDispatch} from "react-redux";
import Modal, {hideModal} from "shared/dapp-common/components/Modal"
import Button from "components/Button";
import RadioButtons from "components/RadioButtons"
import './HeroPropsModal.scss'
import {updateCharacter} from "store/game";
import {GENDERS, BUILDS, SKIN_TONES} from "consts"

const HeroPropsModal = ({character: currCharacter}) => {

    const dispatch = useDispatch()

    const [character, setCharacter] = useState(_.clone(currCharacter))

    const closeModal = () => {
        setCharacter(currCharacter)
        dispatch(hideModal())
    }

    const updateProps = update => setCharacter({...character, ...update})

    const save = () => {
        dispatch(updateCharacter(character))
        dispatch(hideModal())
    }

    const {name, gender, build, tone, team} = character
    // const heroClassName = `hero-${team}-${gender}-${build}-${tone}`

    return (
        <Modal className="hero-props-modal" title="Edit Appearance">
            {/*<div className="center-aligned-spaced-row row">*/}
            {/*    <div className={classNames("hero-image", heroClassName)}/>*/}
            {/*    */}
            {/*</div>*/}
            <div className="hero-props">
                <div className="center-aligned-spaced-row row">
                    <div className="cell">Hero Name</div>
                    <div className="cell input-container">
                        <input type="text" className="input themed" value={name} onChange={e => updateProps({name: e.target.value})}/>
                        <span className="input-message">Alias names are recommended. Never reveal your secret identity!</span>
                    </div>
                </div>
                <div className="center-aligned-spaced-row row">
                    <div className="cell">Gender</div>
                    <div className="cell input-container radio-container">
                        <RadioButtons id="gender" options={GENDERS} selected={gender} onChange={gender => updateProps({gender})}/>
                    </div>
                </div>
                <div className="center-aligned-spaced-row row">
                    <div className="cell">Build</div>
                    <div className="cell input-container radio-container">
                        <RadioButtons id="build" options={BUILDS} selected={build} onChange={build => updateProps({build})}/>
                    </div>
                </div>
                <div className="center-aligned-spaced-row row">
                    <div className="cell">Skin Tone</div>
                    <div className="cell input-container radio-container">
                        <RadioButtons id="tone" className="tone" options={SKIN_TONES} selected={tone} onChange={tone => updateProps({tone})}/>
                    </div>
                </div>
            </div>
            <div className="buttons">
                <Button className="button-full themed" onClick={save}>Save</Button>
                <Button className="themed" onClick={closeModal}>Cancel</Button>
            </div>
        </Modal>
    )
}

export default HeroPropsModal
