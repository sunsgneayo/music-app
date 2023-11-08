import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
      <div style={{
          background: 'linear-gradient(rgb(255, 38, 142) 0%, rgb(255, 105, 79) 100%)'
      }}>
    <App />
      </div>
  </React.StrictMode>,
)
