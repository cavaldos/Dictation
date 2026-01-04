import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './global.css'
import App from './App.tsx'
import { ThemeProvider } from '~/redux/ThemeProvider';
import ProviderGlobal from './redux/provider.tsx';
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ProviderGlobal>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </ProviderGlobal>
  </StrictMode>,
)
