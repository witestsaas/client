import { Auth0Provider } from '@auth0/auth0-react';

// TODO: Replace with your actual Auth0 domain and client ID from your Auth0 dashboard
const AUTH0_DOMAIN = "dev-2qsc1w4p3twrz2h4.us.auth0.com"; // e.g. dev-abc123.us.auth0.com
const AUTH0_CLIENT_ID = "your-client-id-here"; // e.g. abc123XYZ456

export const AuthProvider = ({ children }) => (
  <Auth0Provider
    domain={AUTH0_DOMAIN}
    clientId={AUTH0_CLIENT_ID}
    authorizationParams={{
      redirect_uri: window.location.origin
    }}
  >
    {children}
  </Auth0Provider>
);
