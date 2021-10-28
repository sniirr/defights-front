import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import reportWebVitals from './reportWebVitals';
import {Provider} from 'react-redux';
import makeStore from './store/makeStore'

String.prototype.insertAt = function(index, string)
{
    return this.substr(0, index) + string + this.substr(index);
}

const store = makeStore()

const mql = window.matchMedia("(max-width: 480px)")
window.IS_MOBILE = mql.matches

const handleMediaChange = mql => {
    window.IS_MOBILE = mql.matches
}
mql.addListener(handleMediaChange)

ReactDOM.render(
    <Provider store={store}>
        <React.StrictMode>
            <App/>
        </React.StrictMode>
    </Provider>,
    document.getElementById('root')
);
// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
