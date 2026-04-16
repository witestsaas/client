import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './styles/globals.css';
import App from './App.jsx';
import { AuthProvider } from './auth/AuthProvider.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import { ThemeProvider } from './utils/theme-context.tsx';
import { LanguageProvider } from './utils/language-context.jsx';
import { SocketProvider } from './hooks/useSocket.tsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <ThemeProvider>
        <LanguageProvider>
          <SocketProvider>
            <BrowserRouter>
              <ErrorBoundary>
                <App />
              </ErrorBoundary>
            </BrowserRouter>
          </SocketProvider>
        </LanguageProvider>
      </ThemeProvider>
    </AuthProvider>
  </StrictMode>,
);


/* 
main.jsx does three core jobs:
1. It sets up the React application by rendering the App component into the root DOM element.
2. It wraps the App component with several context providers (AuthProvider, ThemeProvider, SocketProvider) to manage authentication, theming, and WebSocket connections across the entire application.
3. It uses BrowserRouter to enable client-side routing and ErrorBoundary to catch and handle any errors that occur in the component tree. 
You can think of main.jsx as the entry point that initializes the React application and provides the necessary context and routing for the rest of the app to function properly.

-> Import React, { StrictMode } from 'react';
   -> React is the core library that defines how components, JSX, hooks, and reconciliation work.
   -> StrictMode is a special component that enables extra development-only checks: double rendering some parts, re-running effects, and warning about deprecated APIs.
-> Import ReactDOM from 'react-dom/client';
   -> react-dom/client exposes createRoot, the modern root API, which connects the React tree to a real DOM container.
-> Import {createBrowserRouter, RouterProvider} from 'react-router-dom';
   -> createBrowserRouter is a function that creates a router instance using the HTML5 history API, allowing for clean URLs and navigation without page reloads.
   -> RouterProvider is a component that takes a router instance and makes it available to the rest of the app, enabling routing functionality.
-> Import './styles/globals.css';
   -> This imports global CSS styles that apply to the entire application, ensuring consistent styling across all components.
-> Import App from './App.jsx';
   -> App is the root component of the application that defines the main structure and routes of the app.
-> Import { AuthProvider } from './auth/AuthProvider.jsx';
   -> AuthProvider is a context provider that manages authentication state and logic, making it accessible throughout the app.
-> Import ErrorBoundary from './components/ErrorBoundary.jsx';
   -> ErrorBoundary is a component that catches JavaScript errors anywhere in its child component tree, logs those errors, and displays a fallback UI instead of crashing the whole app.
-> Import { ThemeProvider } from './utils/theme-context.tsx';
   -> ThemeProvider is a context provider that manages theming (e.g., light/dark mode) for the application, allowing components to access and respond to theme changes.
-> Import { SocketProvider } from './hooks/useSocket.tsx';
   -> SocketProvider is a context provider that manages WebSocket connections, enabling real-time communication features across the app.

-> createRoot(document.getElementById('root')).render(
   -> This line initializes the React application by creating a root and rendering the component tree into the DOM element with the id 'root'.
   -> The component tree is wrapped in several providers to ensure that authentication, theming, and WebSocket functionality are available throughout the app.  
*/