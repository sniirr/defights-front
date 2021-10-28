import React, {useState} from 'react'
import './FAQPage.scss'
import {Collapse} from 'react-collapse'
import _ from 'lodash'
import {TEAMS} from "consts";
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome'
import {faMinus, faPlus} from "@fortawesome/free-solid-svg-icons";

const FAQS = [
    {
        title: 'What is DeFights?',
        content: () => (
            <p>DeFights is the front-end interface for the DAPP token liquidity mining rewards program. DeFights acts as
                the incentive layer for liquidity providers in the DAPP/BNT liquidity pool on Bancor. After depositing
                tokens into the liquidity pool, users can participate by staking their LP tokens into the DeFights smart
                contract, which entitles them to begin earning DAPP liquidity rewards.</p>
        )
    },
    {
        title: 'What is the DAPP Bridge and what is its purpose?',
        content: () => (
            <>
                <p>As a multi-chain token, the DAPP token supply is spread across multiple blockchains including
                    Ethereum and EOS. To participate in DeFights for liquidity mining, users are required to use the
                    ERC20 version of DAPP on Ethereum.</p>
                <p>Using DAPP Network technology, a bridge connecting Ethereum and EOS was built to allow the passing of
                    DAPP tokens between chains. For a helpful guide on how to transfer DAPP tokens from EOS to
                    Ethereum, <a target="_blank" rel="noreferrer"
                                 href="https://medium.com/the-liquidapps-blog/dapp-token-cross-chain-bridging-guide-6c32bc627398">click
                        here.</a></p>
            </>
        )
    },
    {
        title: 'How do DAPP<> BNT Staking Pool reward calculations work?',
        content: () => (
            <>
                <p>DAPP token holders can stake their tokens in any of six staking pools, each with a different lockup
                    period and rewards.</p>
                <p>The percentage of DAPP rewards flowing into each staking pool is determined by the lockup period of
                    the pool relative to the aggregation of all pools’ lockup periods, as follows:</p>
                <ul>
                    <li>A 100-day lockup period pool receives 4.76% of DAPP rewards.</li>
                    <li>A 6-month lockup period pool receives 9.52% of DAPP rewards.</li>
                    <li>A 12-month lockup period pool receives 19.05% of DAPP rewards.</li>
                    <li>An 18-month lockup period pool receives 28.57% of DAPP rewards.</li>
                    <li>A 24-month lockup period pool receives 38.10% of DAPP rewards.</li>
                </ul>
                <p>Each pool's Annual Percentage Rate (APR) is determined by the number of rewards distributed by the
                    pool and the number of DAPPs staked into it.</p>
            </>
        )
    },
    {
        title: 'How does single sided exposure work?',
        content: () => (
            <>
                <p>When staking DAPP tokens on DeFighits, users provide liquidity to a Bancor pool using only DAPP
                    tokens, thus maintaining 100% exposure to DAPP. In contrast, other AMMs require LPs to take on
                    exposure to multiple assets by requiring them to add tokens to both sides of the pool. </p>
                <p>Providing single-sided staking for DAPP is made possible using a 500k BNT co-investment provided by
                    the Bancor Protocol to match user deposits with BNT. For example, a user deposit of $10K worth of
                    DAPP triggers $10K worth of BNT emissions by the protocol into the DAPP pool.</p>
                <p>As the entire process of single-sided exposure is transparently handled by the Bancor Protocol and
                    DeFights, DeFights users won't have to deal with multiple platforms in order to use the service.</p>
            </>
        )
    },
    {
        title: 'How does DAPP external IL Protection on Bancor Network work?',
        content: () => (
            <>
                <p>Impermanent loss (IL) occurs in AMM pools when the prices of the tokens in a pool diverge in any
                    direction. The more divergence, the greater the IL, reducing an LP’s profits from swap fees and
                    rewards.</p>
                <p>Traditionally, Bancor v2.1 removes IL risk for LPs and transfers it to the Bancor Protocol, which
                    aggregates and backstops IL risk across its pools. The protocol uses fees earned from its
                    co-investments to compensate for the network-wide cost of IL. If there aren’t enough fees to fully
                    compensate an LP’s IL at the time of their withdrawal, the protocol mints BNT to cover the
                    delta.</p>
                <p>DeFights by DAPP Network introduced a new model that uses the DAPP token to cover impermanent loss
                    instead of BNT. This eliminates the risk taken by the Bancor Protocol for its co-investment and
                    allows such projects to have better chances of approval by the Bancor DAO. More importantly, the
                    DAPP <b>external IL protection makes sure that a user staking DAPP on DeFights will receive at least
                        as many DAPPs as they originally staked (plus fees and rewards) when withdrawing from the
                        liquidity pool.</b></p>
            </>
        )
    },
    {
        title: 'What’s “My Hero”?',
        content: () => (
            <>
                <p>Every account on DeFights has an associated hero with their own custom attributes and unique
                    look.</p>
                <p>
                    <b>Customizable Attributes and Visualizations:</b>
                    <ul>
                        <li>Hero’s Name</li>
                        <li> Hero’s Guild</li>
                        <li>Hero's Gender</li>
                        <li>Hero's Build</li>
                        <li>Skin Tone</li>
                    </ul>
                </p>
                <p>Go ahead and personalize your superhero!</p>
            </>
        )
    },
    {
        title: 'What are the Guilds?',
        content: () => (
            <>
                <p>Each participant in DeFights is able to choose which Guild their hero will belong to. Think of it as a custom skin for determining the look and feel of your DeFights Dashboard.</p>
                {_.map(TEAMS, ({text, words, description}, i) => (
                    <p key={`faq-team-${i}`}>
                        <b>{_.toUpper(text)}</b> - {words}<br/>
                        {description}
                    </p>
                ))}
                <p>Let the DeFights begin!</p>
            </>
        )
    },
]

const FAQ = ({title, content}) => {
    const [isOpen, setIsOpen] = useState(false)

    return (
        <div className="faq-item">
            <div className="center-aligned-row faq-title" onClick={() => setIsOpen(!isOpen)}>
                <FontAwesomeIcon icon={isOpen ? faMinus : faPlus}/>
                {title}
            </div>
            <Collapse isOpened={isOpen}>
                <div>{content()}</div>
            </Collapse>
        </div>
    )
}

const FAQPage = () => {
    return (
        <div className="page faq-page">
            <div className="page-inner">
                <div className="page-title">Frequently Asked Questions</div>
                <div className="panel faq-panel">
                    <div className="panel-content">
                        {_.map(FAQS, faq => <FAQ {...faq}/>)}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default FAQPage