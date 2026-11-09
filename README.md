# Commercial Insurance Brokerage MVP (B2B)

A starter full-stack MVP for business customers, insurance brokers, and platform admins.

## Stack
- Frontend: Next.js (App Router) + TypeScript
- Backend: Node.js + Express.js
- Database: MongoDB + Mongoose
- Authentication: JWT (role-based)
- Styling: plain CSS (intentionally functional, not design-heavy)

## Included MVP workflows
- Business customer registration/login
- Customer company profile and insurance enquiry creation
- D&O, Cyber Liability, and Key-Person enquiry categories
- Customer dashboard with enquiry status
- Broker dashboard to review enquiries, update status, and add quotations
- Admin dashboard with user/enquiry overview
- Broker/customer quotation visibility
- Basic AI-ready risk assessment placeholder (rule-based, clearly labelled; no automated underwriting)
- Document metadata upload endpoint (local uploads folder for development)

> Important: This is a development MVP scaffold, not a licensed insurance intermediary system. It does not bind coverage, issue policies, calculate insurer-approved premiums, or provide regulated insurance advice. Real quotes and coverage must be supplied and verified by authorized brokers/insurers. Have security, privacy, legal, and insurance compliance reviewed before production.

## Prerequisites
- Node.js 20+
- MongoDB local instance or MongoDB Atlas connection string
- npm

## Setup

### 1. Backend
```bash
cd backend
cp .env.example .env
npm install
npm run dev
```
Backend runs at `http://localhost:5000`.

Set `MONGO_URI` and a long random `JWT_SECRET` in `backend/.env`.

### 2. Frontend
In a second terminal:
```bash
cd frontend
cp .env.local.example .env.local
npm install
npm run dev
```
Frontend runs at `http://localhost:3000`.

## First admin
Register a normal account through the UI, then promote it manually in MongoDB:
```js
db.users.updateOne({ email: "you@example.com" }, { $set: { role: "admin" } })
```
Do not expose public admin registration.

## Roles
- `customer`: create enquiries, see own enquiries and quotations
- `broker`: see all enquiries, update status, add quotation
- `admin`: dashboard overview and user/enquiry visibility

For a real deployment, add broker assignment/tenancy rules, audit logs, malware scanning, private object storage, email/SMS notifications, rate limiting, CSRF strategy where applicable, refresh-token rotation, backups, monitoring, and formal authorization tests.
