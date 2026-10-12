// Initialize Sentry before anything else so boot errors are captured.
import './lib/sentry';

import React from 'react';
import ReactDOM from 'react-dom/client';
import * as Sentry from '@sentry/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Register the web HTTP implementation (axios) as the spine's apiClient.
// Side-effect import — must run before any service call.
import './lib/httpClient';

// Import Ant Design styles
import '@ant-design/v5-patch-for-react-19';

// Import custom styles (with Tailwind)
import './styles/index.css';
import App from './App';

// Create a client
const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById('root')!, {
  // Report render errors React catches or can't recover from.
  onUncaughtError: Sentry.reactErrorHandler(),
  onCaughtError: Sentry.reactErrorHandler(),
  onRecoverableError: Sentry.reactErrorHandler(),
}).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>,
);
