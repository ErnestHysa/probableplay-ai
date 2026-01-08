import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

console.log('index.tsx loading...');

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

console.log('Root element found, creating React root...');

const root = ReactDOM.createRoot(rootElement);
console.log('React root created, rendering app...');

root.render(
  <App />
);