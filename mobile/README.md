# CoverBridge Mobile (Expo)

Separate Expo SDK 54 / React Native / TypeScript application using Expo Router. The website and Render backend are unchanged.

## Requirements
- Node.js LTS (20+ recommended)
- Android Studio emulator or Android phone with Expo Go
- EAS account for cloud APK builds

## Install and run
```bash
cd mobile
npm install
cp .env.example .env
# EXPO_PUBLIC_API_URL defaults to the deployed Render API
npx expo install --fix
npx expo start
```
Scan the QR code with Expo Go, or press `a` to launch an Android emulator.

## Type-check and Android export
```bash
npm run typecheck
npx expo export --platform android
```

## Build installable APK
```bash
npx eas-cli build:configure
npx eas-cli build --platform android --profile preview
```

## Implemented screens and workflows
- Customer registration and password login followed by mandatory email OTP verification
- Forgot password and OTP-based password reset
- JWT storage in Expo SecureStore; profile refresh through `GET /auth/me`
- Role-aware dashboards for customer, broker and admin
- Customer enquiry submission and history
- Broker/admin enquiry status changes
- Broker/admin quotation editor; customer quotation viewing
- Customer Risk Passport checklist and broker/admin passport review
- Profile and sign-out
- Admin user listing and role assignment with confirmation; backend retains authorization and last-admin safeguards

Public registration creates customer accounts only. Broker/admin roles must be assigned by an administrator. Email OTP depends on the existing backend Gmail Apps Script configuration. Risk Passport is a broker-preparation checklist, not underwriting or insurance advice.

## Notes
- Only the public API base URL belongs in the Expo environment. Never put backend secrets in the mobile bundle.
- Document upload and a native document picker are not included in this first mobile release.
