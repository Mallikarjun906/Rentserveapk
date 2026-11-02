# NUK RentServe React Frontend

A React + Vite frontend for NUK RentServe. The existing Node.js/Express/MongoDB backend remains in `../NUKBackend-main`.

## Requirements

- Node.js 20 or newer
- npm
- Existing backend configured with its own `.env`

## Setup

1. Open a terminal in `NUKFrontend-react`.
2. Create a local environment file by copying `.env.example` to `.env`.
3. For local development, set `VITE_API_BASE_URL=http://localhost:5000/api/v1`. Production defaults are set in `.env.production` to `https://nukrentserve2026.onrender.com/api/v1`; the hosting provider environment variable overrides the file.
4. For Google Sign-In, configure a Google Identity Services Web Client ID in `VITE_GOOGLE_CLIENT_ID` and set the matching `GOOGLE_CLIENT_ID` in the backend environment. Add the local frontend origin (for example `http://localhost:5173`) to the authorized JavaScript origins in Google Cloud Console. Never put the Google client secret in the frontend.
5. Install packages and run the app:

```bash
npm install
npm run dev
```

Production build:

```bash
npm run build
```

## Backend integration notes

- The frontend uses the existing `/auth/login`, `/auth/register`, `/auth/forgot-password` and `/auth/google` API routes.
- The provided backend does not define a support-contact API route. The contact page therefore uses an optional `VITE_SUPPORT_EMAIL` mailto fallback and clearly reports when no recipient is configured; it does not falsely claim a backend submission succeeded.
- The new transport approvals, document uploads, booking state transitions and enquiry-chat workflows still require their corresponding secure backend APIs to be inspected and implemented before production use. UI visibility alone is not authorization.
- Public photographs are served from Unsplash image URLs and require internet access. Replace them with appropriately licensed local assets for production if desired.


## React frontend: production API connection

The React frontend production build reads `NUKFrontend-react/.env.production`, which is configured to use `https://nukrentserve2026.onrender.com/api/v1`. If you deploy the frontend on Vercel or another host, set the same `VITE_API_BASE_URL` in that host's frontend environment variables and redeploy. Vite environment variables are baked into the frontend at build time.

### Google sign-in setup

The Google button is now visible even when the Google client ID has not been configured. To complete sign-in, set `VITE_GOOGLE_CLIENT_ID` in the frontend host to your Google OAuth Web Client ID, and set the matching `GOOGLE_CLIENT_ID` in the existing backend's environment. In Google Cloud Console, authorize the exact frontend origin. Never put a Google client secret in a `VITE_` variable. The button cannot authenticate until the real client ID and backend configuration are present.

### Backend CORS

The deployed backend must allow the exact public origin of the frontend. The current backend allows `https://nukrentserve2026.vercel.app` and local Vite development origins. If your frontend is hosted at another domain, add that origin to `CLIENT_ORIGIN` in the Render backend environment and redeploy the backend; do not use wildcard origins with credentialed authentication.


The provider registration form uses `POST /providers/register` under the `/api/v1` prefix.

## Latest UI and provider application update

- The homepage hero now uses the project's Karnataka/Hampi heritage artwork; the rental category still uses a real home photograph.
- The transport page has clearer vehicle cards, Kannada labels, a request workflow explanation, and one removable demo listing. The demo item is never submitted as real marketplace data.
- Search and provider registration accept free-text city/taluk/district values rather than limiting providers to a short predefined city list.
- Provider registration requires a profile photo; Auto, Passenger car, and Goods van applicants must also upload at least one vehicle photo.
- Production API base: `https://nukrentserve2026.onrender.com/api/v1` (see `.env.production`).

### Backend deployment requirement

The backend source in `../NUKBackend-main` was updated to validate and store provider photos plus free-text city, taluk, and district. These backend changes do not automatically alter the already-hosted Render service. Deploy the updated `NUKBackend-main` folder to Render before testing the new provider registration form. The backend needs valid Cloudinary environment variables for secure image uploads.

### Test status

Static backend JavaScript syntax checks were run. A full Vite build and Jest integration suite could not be executed in this environment because npm registry DNS resolution failed (`EAI_AGAIN registry.npmjs.org`). Run `npm install && npm run build` in this frontend folder and `npm install && npm test` in `../NUKBackend-main` before public deployment.
