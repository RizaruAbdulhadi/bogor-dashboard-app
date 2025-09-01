import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter, BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';
import reportWebVitals from './reportWebVitals';

// ✅ Gunakan HashRouter untuk development, BrowserRouter untuk production
const isLocalDevelopment = window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname === '192.168.1.101';

const RouterComponent = isLocalDevelopment ? HashRouter : BrowserRouter;

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <React.StrictMode>
        <RouterComponent>
            <App />
        </RouterComponent>
    </React.StrictMode>
);

reportWebVitals();