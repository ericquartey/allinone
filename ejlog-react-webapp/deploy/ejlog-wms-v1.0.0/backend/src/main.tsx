import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Provider } from 'react-redux';
import { Toaster, ToastOptions } from 'react-hot-toast';
import { store } from './app/store';
import { DashboardConfigProvider } from './features/dashboard/context/DashboardConfigContext';
import App from './App';
import './styles/index.css';
import { reportWebVitals } from './utils/reportWebVitals';
// Import i18n configuration
import './i18n/config';

// Configure React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

// Toast configuration with proper typing
const toastOptions: ToastOptions = {
  duration: 4000,
  position: 'top-right',
  style: {
    background: '#32373c',
    color: '#fff',
  },
  success: {
    iconTheme: {
      primary: '#E30613',
      secondary: '#fff',
    },
  },
  error: {
    iconTheme: {
      primary: '#E30613',
      secondary: '#fff',
    },
  },
};

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element not found. Make sure you have a <div id="root"></div> in your index.html');
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <DashboardConfigProvider>
          <BrowserRouter>
            <App />
            <Toaster toastOptions={toastOptions} />
          </BrowserRouter>
        </DashboardConfigProvider>
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </Provider>
  </React.StrictMode>
);

// Start tracking Web Vitals performance metrics
reportWebVitals();
