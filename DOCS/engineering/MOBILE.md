# CardVault Mobile (Expo)

Expo SDK **54** field app for sales employees — scan business cards, manage contacts, join event sessions, and request exports. Managers and platform admins use the **WEB** console instead.

**Stack:** Expo Router 6 · React Native 0.81 · React 19 · Zustand 5 · TanStack Query 5 · Axios

See also: [LOCAL_DEV.md](./LOCAL_DEV.md) (MOBILE setup), [DEPLOY_ENV.md](./DEPLOY_ENV.md) (Expo/EAS env vars), [CARD_SCANNING.md](./CARD_SCANNING.md) (OCR flow across MOBILE/API).

---

## Directory layout

```
MOBILE/
├── app/                 # Expo Router file-based routes
│   ├── _layout.tsx      # Root stack, auth gate, React Query provider
│   ├── index.tsx        # Redirect entry
│   ├── login.tsx
│   ├── (tabs)/          # Bottom tab shell (home, contacts, export, profile)
│   ├── contact/         # Create, detail, edit
│   ├── events/          # Create, detail, edit
│   ├── encounter-select.tsx
│   ├── ocr-review.tsx   # Post-scan OCR confirm UI
│   └── notifications.tsx
├── components/          # Shared UI (contact form, camera modal, avatars)
├── hooks/               # useThemeColors
├── lib/                 # API client, types, format, constants, OCR helpers
├── stores/              # Zustand stores (see below)
└── package.json
```

There is **no** `MOBILE/contexts/` folder today. Capture/session state lives in **`stores/session-store.ts`** (Zustand), not a React Context provider.

---

## Routing (Expo Router)

### Root stack (`app/_layout.tsx`)

- Wraps the app in `SafeAreaProvider`, `QueryClientProvider`, and an **AuthGate**.
- **AuthGate** loads tokens from AsyncStorage on boot, then redirects:
  - unauthenticated users → `/login`
  - authenticated users on `/login` → `/(tabs)/home`
- Registers stack screens for tabs, contacts, events, OCR review, etc.

### Tab navigator (`app/(tabs)/_layout.tsx`)

Visible tabs:

| Tab | Route | Purpose |
|-----|-------|---------|
| Home | `home` | Dashboard, active session, quick capture entry |
| Contacts | `contacts` | Org contact list |
| Export | `export` | Request CSV/XLSX/PDF exports |
| Profile | `profile` | Account, notifications link, sign out |

Hidden from tab bar (`href: null`) but still routable:

| Screen | Route | Purpose |
|--------|-------|---------|
| Scan | `scan` | Camera/gallery pick → OCR upload |
| Events | `events` | Session list (linked from Home) |

### Common navigation flows

```
Login → (tabs)/home
Home → encounter-select → quick capture → scan → ocr-review → contact saved
Home → scan (with active event session) → ocr-review
Contacts → contact/[id] → contact/edit/[id]
Events → events/[id] → events/edit/[id]
```

---

## State management (Zustand)

Stores live under **`MOBILE/stores/`** (not `lib/stores/`).

| Store | File | Purpose |
|-------|------|---------|
| **Auth** | `auth-store.ts` | In-memory session: `user`, `accessToken`, `refreshToken`, `hydrated` flag; `setSession` / `clearSession` used after login/logout and 401 handling |
| **Session / capture** | `session-store.ts` | Active event session ID, capture mode (`visitor` / `exhibitor` / `quick_capture`), encounter type for quick capture; drives scan uploads and OCR metadata |
| **Theme** | `theme-store.ts` | Light/dark preference persisted to AsyncStorage (`cardvault_theme`) |

**Correction:** Older audit docs (e.g. `SAAS_GAP_AUDIT_TRD.md`) claimed MOBILE had Zustand in `package.json` but **no store files**. As of this writing, three store modules exist under `MOBILE/stores/`.

Server-fetched lists (contacts, sessions, notifications) use **TanStack React Query** in screen components — not Zustand.

---

## Auth & token persistence

### MOBILE pattern (JWT in AsyncStorage)

1. **Login** (`app/login.tsx`) calls `login()` from `lib/api-client.ts`, then `persistAuth()` in `lib/api.ts`.
2. **Persistence:** `AsyncStorage` keys from `lib/constants.ts`:
   - `cardvault_access_token`
   - `cardvault_refresh_token`
   - `cardvault_user` (JSON `UserProfile`)
3. **In-memory token** for axios: `lib/api-config.ts` holds the current access token; refresh token in module scope inside `lib/api.ts`.
4. **Boot:** `loadStoredAuth()` in `_layout.tsx` restores tokens + user profile.
5. **401 refresh:** `createApiClient()` in `lib/api-client.ts` POSTs to `/auth/refresh` with refresh token body, updates AsyncStorage via `onTokensRefreshed`.
6. **Logout:** clears AsyncStorage and Zustand auth store.

`lib/auth-storage.ts` duplicates storage key names but is **not imported** elsewhere — **`lib/api.ts` is the canonical auth persistence layer**.

### Contrast with WEB

| | MOBILE | WEB |
|---|--------|-----|
| Tokens | AsyncStorage + in-memory | httpOnly cookies via BFF (`/api/auth/*`) |
| API calls | Direct to NestJS (`EXPO_PUBLIC_API_URL` + `/api/v1`) | Same-origin BFF proxy (`/api/proxy`) |
| Profile hint | AsyncStorage `cardvault_user` | Zustand UI-only (no token storage) |

---

## API client usage

### Configuration

- **`EXPO_PUBLIC_API_URL`** — API host **without** `/api/v1` (see `MOBILE/.env.example`).
- Resolved in `lib/api-config.ts` (also supports `expo.extra.apiUrl` from app config).
- Full REST prefix: `getApiHost() + API_BASE_PATH` → e.g. `http://192.168.0.106:8000/api/v1`.

### Singleton client

```typescript
// lib/api.ts
export const api = createApiClient({
  baseURL: getApiHost(),
  getAccessToken,
  getRefreshToken,
  onTokensRefreshed,  // writes AsyncStorage
  onUnauthorized,     // clearAuth + clearSession
});
```

Import `api` in screens/hooks; call domain functions from `lib/api-client.ts`:

```typescript
import { api } from '@/lib/api';
import { fetchContacts, submitOcrJob } from '@/lib/api-client';

const contacts = await fetchContacts(api, { page: 1, limit: 20 });
```

Domain functions take `AxiosInstance` as first argument — they do not create their own client.

### Mobile-specific client behavior (`lib/api-client.ts`)

- Injects `Authorization: Bearer …` from `getAccessToken()`.
- Sets `X-Client-Platform: cardvault-mobile`.
- Strips default `Content-Type` for `FormData` uploads (OCR images).
- Native OCR upload via `submitOcrJobNative()` in `lib/submit-ocr-upload.ts`.
- User-facing network errors via `getApiErrorMessage()`.

---

## Session capture & OCR flow

There is no React Context for capture. **`useSessionStore`** holds:

- `activeSessionId` — optional linked event session
- `activeMode` — `visitor` | `exhibitor` | `quick_capture`
- `activeEncounterType` — set during quick capture (`encounter-select.tsx`)

### Typical scan pipeline

1. **Home** or **Events** sets active session/mode via `setActiveSession()`.
2. **Quick capture:** `encounter-select.tsx` → sets mode `quick_capture` + encounter type → navigates to Home with scanner open.
3. **Scan** (`(tabs)/scan.tsx`): pick image → `submitOcrJob(api, file, { captureMode, sessionId, clientIdempotencyKey })`.
4. **Poll / review:** `ocr-review.tsx` loads job, shows extracted fields, duplicate matches, confirm via `confirmOcrJob()`.
5. **Logging:** `lib/capture-logger.ts` emits `[CardCapture]` lines to Metro for debugging.

Capture mode and session ID are sent to the API on OCR submit and stored on the resulting contact.

---

## Shared `lib/` modules

| Module | Role |
|--------|------|
| `types.ts` | Domain TypeScript types (keep aligned with `API/src/contracts/types.ts` and `WEB/lib/types.ts`) |
| `constants.ts` | `API_BASE_PATH`, `STORAGE_KEYS`, `COLORS` |
| `format.ts` | Lead labels, capture mode labels, initials |
| `roles.ts` | `MOBILE_APP_ROLES`, `isMobileAppRole` |
| `ocr-form-mapper.ts` | Maps OCR job fields → contact form |
| `push-notifications.ts` | Expo push token registration |
| `uuid.ts` | Client idempotency keys for OCR uploads |

---

## Components

| Component | Role |
|-----------|------|
| `CameraScannerModal.tsx` | Camera UI wrapper |
| `contact-form.tsx` | Shared contact create/edit fields |
| `SessionMemberAvatars.tsx` | Event session member display |

---

## Type contract sync

Shared API types are maintained in:

- `API/src/contracts/types.ts` (contract source comment)
- `MOBILE/lib/types.ts`
- `WEB/lib/types.ts`

There is **no** `packages/shared-types` workspace package yet (only `packages/eslint-config` exists at repo root). When a shared types package is added, update this doc and the contract header accordingly.

---

## Known large files (refactor candidates)

Documented as **technical debt** — do not refactor in passing.

| File | ~Lines | Notes |
|------|--------|-------|
| `app/ocr-review.tsx` | 590 | OCR polling, form state, duplicate resolution, confirm flow — candidate to split into hooks + subcomponents |
| `app/(tabs)/profile.tsx` | 350 | Profile, notifications preview, settings — candidate to extract sections |

---

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `EXPO_PUBLIC_API_URL` | Yes (local) | API origin without `/api/v1`. Example: `http://192.168.0.106:8000` |

Copy `MOBILE/.env.example` → `MOBILE/.env`. Restart Expo after changes.

See [DEPLOY_ENV.md](./DEPLOY_ENV.md) for build-time injection and future EAS profiles.

---

## Scripts

```powershell
cd MOBILE
npm start          # expo start
npm run android
npm run ios
npm run typecheck
npm run lint
```

Demo login: `employee@cardvault.local` / `Password123!` (requires API seed).
