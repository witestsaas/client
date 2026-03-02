# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

## Auth0 Configuration

The frontend now uses Auth0 for authentication.

1. Copy env template:
	- `cp .env.example .env`
2. Set the required variables:
	- `VITE_AUTH0_DOMAIN`
	- `VITE_AUTH0_CLIENT_ID`
	- `VITE_AUTH0_AUDIENCE`
3. Optional Google connection override:
	- `VITE_AUTH0_GOOGLE_CONNECTION` (default `google-oauth2`)
4. Ensure callback URL in Auth0 includes:
	- `http://localhost:5173/auth/callback`
