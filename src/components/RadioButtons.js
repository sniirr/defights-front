import React from 'react'
import _ from "lodash";
import classNames from "classnames";

// const RadioButtons = ({id, options, selected, onChange}) => {
//     return (
//         <div className="radio-buttons">
//             {_.map(options, ({value, label}, i) => {
//                 const v = _.isNil(value) ? i : value
//                 return (
//                     <div key={`radio-btn-${id}-${i}`} className={classNames("radio", {selected: selected === v})} onClick={() => onChange(v)}>{label}</div>
//                 )
//             })}
//         </div>
//     )
// }

const RadioButtons = ({name, options, selected, onChange, className}) => {
    return (
        <div className="radio-buttons">
            {_.map(options, ({value, label}, i) => {
                const v = _.isNil(value) ? i : value
                return (
                    <div key={`radio-btn-${name}-${i}`} className={classNames("radio", className, {selected: v === selected})} onClick={() => onChange(v)}>
                        <div className="radio-dot"/>
                        <input type="radio" name={name}/>
                        <div className="label">{label}</div>
                    </div>
                )
            })}
        </div>
    )
}


export default RadioButtons