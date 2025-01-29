import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { PersistGate } from 'redux-persist/integration/react'
import { store, persistor } from './app/store.js'
import App from './App.jsx'
import './index.css'
import { BrowserRouter as Router, useLocation } from 'react-router-dom'
import { ChatProvider } from './context/ChatContext'
import { GoogleOAuthProvider } from '@react-oauth/google';



createRoot(document.getElementById('root')).render(
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <Router>
        <GoogleOAuthProvider clientId={ import.meta.env.VITE_GOOGLE_CLIENT_ID }>
          <ChatProvider>
            <App />
          </ChatProvider>
        </GoogleOAuthProvider>
        </Router>
      </PersistGate>
    </Provider>,
)
