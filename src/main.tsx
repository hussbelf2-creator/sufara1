import { StrictMode } from 'react'
import './i18n'
import { createRoot } from 'react-dom/client'
import './index.css'
import './pages/home/film.css'
import './styles/store.css'
import './styles/store-extra.css'
import './styles/auth.css'
import './styles/returns.css'
import './styles/legal.css'
import App from './App.tsx'
import ErrorBoundary from './components/ErrorBoundary'
import { installErrorReporting } from './lib/monitoring'

installErrorReporting()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
