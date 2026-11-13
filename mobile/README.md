# BANGLAR TOURNAMENTS — Mobile App

Expo / React Native companion app for the existing BANGLAR TOURNAMENTS platform.

## Requirements
- Node.js LTS and npm
- Expo Go on Android, or Android Studio emulator

## Setup
```bash
cd mobile
npm install
```

Copy `.env.example` to `.env` and set `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` (publishable/anon key only). Never put a service-role key in a client app.

## Run
```bash
npm start
```
Scan the QR code with Expo Go or press `a` for an Android emulator.

## Foundation scope
Includes Expo Router navigation, dark esports theme, Supabase Auth login/registration, SecureStore-backed session persistence, account screen and an MFA/AAL2-aware admin entry gate. Tournament schema integration, wallet ledger, payment workflows and admin CRUD are not enabled yet. They must be implemented against verified database schema and server-side authorization/transaction functions before handling real money.
