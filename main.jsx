import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css'; // Assuming you set up a basic index.css for Tailwind imports

// Find the root element in index.html
const rootElement = document.getElementById('root');

if (rootElement) {
    // Render the main App component
    ReactDOM.createRoot(rootElement).render(
        <React.StrictMode>
            <App />
        </React.StrictMode>
    );
}