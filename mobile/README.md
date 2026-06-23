# MesaLista Mobile (Expo / React Native)

Native app for MesaLista, built on Expo Router + NativeWind. It reuses the
**platform-neutral spine** from `packages/shared` (services, hooks, utils,
platform adapters, config) and the root `types/` — the same code the web app
uses, so business logic never drifts between platforms.

## How shared code is wired

- `packages/shared` and `../types` are linked into `node_modules/@mesalista/{shared,types}`
  by `scripts/link-shared.js` (runs on `postinstall`; rerun manually with
  `npm run link:shared`). Metro resolves them as real packages.
- `babel.config.js` rewrites the spine aliases (`services/…`, `hooks/…`,
  `utils/…`, `config/…`, `platform/…`, `types/…`) to `@mesalista/shared/src/*`
  and `@mesalista/types/*`, matching the web app's alias names so spine-internal
  imports resolve unchanged.
- `metro.config.js` watches the repo root and wraps the config with NativeWind.

## Platform adapters (the only platform-specific glue)

- `src/lib/httpClient.ts` — fetch implementation of the spine's `ApiClient`;
  attaches the session token as `Authorization: Bearer` and shapes errors like
  axios. Registered at boot in `src/providers/AppProviders.tsx`.
- `src/lib/secureStore.ts` — session token persistence via `expo-secure-store`
  (the device-side equivalent of the web's HttpOnly cookie).
- `src/lib/ToastProvider.tsx` — registers the spine's `notify` adapter (toasts).
- `src/auth/AuthContext.tsx` — `useAuth()`; composes the shared `useCurrentUser`
  + `userService`, adding token persistence.

## Running

```bash
npm install            # also links the shared packages
npm run ios            # or: npm run android / npm run web
```

Point the app at the API with `EXPO_PUBLIC_API_URL` (see `.env.example`). In dev
it auto-targets the local Express server (`npm run server` in the repo root)
using the Expo dev-server host; Android emulator uses `10.0.2.2`.
