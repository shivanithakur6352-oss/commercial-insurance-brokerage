# CoverBridge Mobile (Expo)

A separate React Native mobile client for the existing CoverBridge backend. The Next.js website and Express API remain unchanged.

## Stack
- Expo SDK 54
- React Native + TypeScript
- Expo Router
- Expo SecureStore for the JWT session
- Existing Express/MongoDB backend APIs

## Setup
1. Install Node.js LTS.
2. From this directory run `npm install`.
3. Copy `.env.example` to `.env`.
4. Keep `EXPO_PUBLIC_API_URL` pointed at the deployed API:
   `https://commercial-insurance-brokerage.onrender.com/api`
5. Run `npx expo install --fix` to align native package versions with the installed Expo SDK.
6. Run `npx expo start` and scan the QR code using Expo Go, or launch an Android emulator.

## Current first milestone
- Customer/broker/admin login using the existing `POST /auth/login` API
- Customer registration using the existing `POST /auth/register` API
- JWT stored using Expo SecureStore (not browser localStorage)
- Role-based workspace navigation
- Admin overview, users, enquiries, quotations and Risk Passport summary
- Customer enquiry creation and enquiry list
- Broker enquiry status updates

## Next migration screens
- Full Risk Passport questionnaire and save flow
- Broker quotation creation/editing form
- Admin role management actions with confirmation and last-admin protection handling
- Forgot/reset password deep-link flow
- Document upload using Expo DocumentPicker and multipart FormData
- Device-level testing, accessibility, offline/error states and release builds

The mobile app is a new client, not a conversion of DOM elements. Do not move backend secrets into this app. Only the public API base URL belongs in `EXPO_PUBLIC_API_URL`.
