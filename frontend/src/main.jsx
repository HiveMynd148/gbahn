import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { AuthProvider } from './contexts/AuthContext.jsx'
import { CurrencyProvider } from './contexts/CurrencyContext.jsx'
import { ThemeProvider } from './contexts/ThemeContext.jsx'
import { BrowserRouter } from 'react-router-dom'
import ManagedToaster from './components/ManagedToaster'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <CurrencyProvider>
          <ThemeProvider>
            <App />
            <ManagedToaster />
          </ThemeProvider>
        </CurrencyProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
