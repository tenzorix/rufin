import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import './index.css'
import './i18n'
import App from './App.tsx'
import { initTelegram } from './telegram/init.ts'
import { useAuthStore } from './store/useAuthStore.ts'
import { preloadAddressMap } from './components/common/addressMapCache'
import { ADDRESS_MAP_IMAGE } from './constants/address'

const preloadLink = document.createElement('link')
preloadLink.rel = 'preload'
preloadLink.as = 'image'
preloadLink.href = ADDRESS_MAP_IMAGE
document.head.appendChild(preloadLink)

preloadAddressMap()

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

async function bootstrap() {
  await initTelegram();
  useAuthStore.getState().initTelegramAuth();

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </StrictMode>
  );
}

bootstrap();