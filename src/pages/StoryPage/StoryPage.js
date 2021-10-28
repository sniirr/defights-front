import React from 'react'
import storyImg from 'images/story.svg'
import storyMobileImg from 'images/story-mobile.svg'
import './StoryPage.scss'

const StoryPage = () => {
    return (
        <div className="page story-page">
            <div className="page-inner">
                <div className="page-title">
                    <span className="text-red">De</span>Fights Story
                </div>
                <div className="story-image">
                    <img src={window.IS_MOBILE ? storyMobileImg : storyImg} alt="DeFights Story"/>
                </div>
            </div>
        </div>
    )
}

export default StoryPage