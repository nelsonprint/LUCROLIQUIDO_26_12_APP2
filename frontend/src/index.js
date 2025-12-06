import React from "react";
import ReactDOM from "react-dom/client";
import "@/index.css";
import App from "@/App";

// Suprimir erros do ResizeObserver globalmente
const suppressResizeObserverError = () => {
  const errorHandler = (event) => {
    if (event.message && event.message.includes('ResizeObserver loop')) {
      event.stopImmediatePropagation();
      event.preventDefault();
      return false;
    }
  };
  
  window.addEventListener('error', errorHandler);
  
  // Sobrescrever console.error
  const originalError = console.error;
  console.error = (...args) => {
    const message = args.join(' ');
    if (message.includes('ResizeObserver loop')) {
      return;
    }
    originalError.apply(console, args);
  };
};

suppressResizeObserverError();

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
