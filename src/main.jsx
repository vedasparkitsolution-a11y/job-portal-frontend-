import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import { AuthProvider } from './contexts/AuthContext.jsx'
import { LanguageProvider } from './contexts/LanguageContext.jsx'
import './index.css'

window.onerror = function(msg, url, lineNo, columnNo, error) {
    console.error('Global Error:', msg, 'at', url, ':', lineNo, ':', columnNo, error);
    return false;
};

try {
    ReactDOM.createRoot(document.getElementById('root')).render(
        <React.StrictMode>
            <BrowserRouter>
                <LanguageProvider>
                    <AuthProvider>
                        <App />
                    </AuthProvider>
                </LanguageProvider>
            </BrowserRouter>
        </React.StrictMode>
    )
} catch (err) {
    console.error('Render crash:', err);
}
