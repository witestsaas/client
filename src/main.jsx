
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
// import './index.css';
import './styles/globals.css';
import App from './App.jsx';
import { AuthProvider } from './auth/AuthProvider.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </BrowserRouter>
    </AuthProvider>
  </StrictMode>
);
