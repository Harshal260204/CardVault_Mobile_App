# CardVault Mobile

Expo SDK **54** (React Native) app for **field sales** — scan business cards, manage contacts, join event sessions, and request exports. Requires **Expo Go for SDK 54** on your phone or emulator.

Managers and platform admins use the **WEB** console instead.

## Setup

```powershell
cd MOBILE
cp .env.example .env
npm install
npm start
```

Set `EXPO_PUBLIC_API_URL` to your API host **without** `/api/v1`:

| Target | URL |
|--------|-----|
| iOS simulator | `http://localhost:8000` |
| Android emulator | `http://10.0.2.2:8000` |
| Physical device | Your PC LAN IP, e.g. `http://192.168.1.10:8000` |

Ensure the API is running and reachable from the device (same Wi‑Fi for physical devices).

## Demo login

| Email | Password | Role |
|-------|----------|------|
| employee@cardvault.local | Password123! | employee |

## Screens

| Screen | Purpose |
|--------|---------|
| **Home** | Active sessions, recent contacts, quick actions |
| **Contacts** | Search, create, edit, open contact detail |
| **Export** | Request contact exports |
| **Profile** | Account info, notifications, sign out |
| **Scan** | Camera/gallery upload → OCR review → confirm |
| **Events** | Browse and manage event sessions |
| **Notifications** | In-app notification inbox |

## Card capture logs

Scan / OCR events log to the Metro terminal with the prefix `[CardCapture]` (image pick, upload, job status, confirm). Keep `npx expo start` visible while testing captures.

## OCR prerequisites

The API must have Google Cloud Vision configured (`OCR_PROVIDER=google`). See [DOCS/engineering/OCR_GOOGLE_VISION.md](../DOCS/engineering/OCR_GOOGLE_VISION.md).
