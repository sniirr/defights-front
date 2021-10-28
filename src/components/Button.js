import React from "react"
import classNames from "classnames"

export default ({className, children, ...props}) => (
    <div className={classNames("button", className)} {...props}>
        <div className="button-content">{children}</div>
    </div>
)