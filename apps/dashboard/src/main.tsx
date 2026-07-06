import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@radix-ui/themes/styles.css'
import { Theme } from '@radix-ui/themes'
import { ThemeProvider, useDashboardTheme } from './components/ThemeProvider'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App'

const queryClient = new QueryClient()

function Main() {
  const { resolvedTheme } = useDashboardTheme()
  return (
    <Theme panelBackground="solid" appearance={resolvedTheme}
      accentColor="blue"
    >
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
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
