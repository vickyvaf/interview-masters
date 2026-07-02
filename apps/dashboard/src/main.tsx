import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@radix-ui/themes/styles.css'
import { Theme } from '@radix-ui/themes'
import { ThemeProvider, useDashboardTheme } from './components/ThemeProvider'
import App from './App'

function Main() {
  const { resolvedTheme } = useDashboardTheme()
  return (
    <Theme panelBackground="solid" appearance={resolvedTheme}>
      <App />
    </Theme>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <Main />
    </ThemeProvider>
  </StrictMode>,
)
