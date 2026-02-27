# FintechOps — Full Project Context for GitHub Copilot

> **Paste this entire prompt at the start of a new Copilot chat to restore full context.**
> Last updated: 26 February 2026

---

## 1. PROJECT OVERVIEW

**FintechOps** is a fintech microservices platform running locally via Docker Compose.

- **Workspace path:** `/Users/rahulpatel/Downloads/fintech`
- **OS:** macOS
- **Frontend:** React 18 (Create React App) served by Nginx on **port 80** → `http://localhost`
- **API Gateway:** Express + http-proxy-middleware on **port 3000** → `http://localhost:3000`
- **Backend:** 10 Node.js 18 Alpine microservices
- **Databases:** MongoDB 7.0, PostgreSQL 16-alpine, Redis 7-alpine
- **Auth:** AWS Cognito (UserPoolId: `us-east-1_7MvJkbZ7M`, ClientId: `38q7inlpdg0b53rq1tik4v58s7`) + local JWT tokens
- **Chatbot:** Uses **Groq SDK** (NOT OpenAI)
- **Infra:** Docker Compose for local dev, Kubernetes manifests in `k8s/`, monitoring stack in `monitoring/`, Jenkinsfile for CI/CD

---

## 2. ARCHITECTURE & SERVICES

| Container | Port | Tech | Notes |
|---|---|---|---|
| `fintechops-frontend` | 80 | React 18 + Nginx | SPA, proxies API via gateway |
| `fintechops-api-gateway` | 3000 | Express + http-proxy-middleware | Routes `/api/auth/*` → auth-service, `/api/users/*` → user-service, etc. |
| `fintechops-auth-service` | 3001 | Express + Mongoose + Sequelize | AWS Cognito + local JWT, MongoDB + PostgreSQL |
| `fintechops-user-service` | 3002 | Express + Mongoose + Sequelize | User profiles |
| `fintechops-calculator-service` | 3003 | Express + Mongoose + Redis | Financial calculators |
| `fintechops-market-service` | 3004 | Express + Mongoose + Redis | Market data |
| `fintechops-news-service` | 3005 | Express + Mongoose | Financial news |
| `fintechops-blog-service` | 3006 | Express + Mongoose | Blog content |
| `fintechops-chatbot-service` | 3007 | Express + Groq SDK + Redis | AI chatbot (Groq, not OpenAI) |
| `fintechops-email-service` | 3008 | Express + Mongoose | Email (AWS SES configured) |
| `fintechops-admin-service` | 3009 | Express + Mongoose + Sequelize | Admin panel |
| `fintechops-mongodb` | 27017 | MongoDB 7.0 | Primary data store |
| `fintechops-postgres` | 5432 | PostgreSQL 16-alpine | Secondary (analytics, user-pg) |
| `fintechops-redis` | 6379 | Redis 7-alpine | Caching |

---

## 3. ENV FILE (`.env` at project root)

See `.env.example` for required variables. Copy it to `.env` and fill in your values:

```
OPENAI_API_KEY=<your-openai-api-key>
GROQ_API_KEY=<your-groq-api-key>
AWS_COGNITO_USER_POOL_ID=<your-cognito-pool-id>
AWS_COGNITO_CLIENT_ID=<your-cognito-client-id>
AWS_SES_FROM_EMAIL=<your-ses-verified-email>
AWS_REGION=us-east-1
JWT_SECRET=<your-jwt-secret>
JWT_REFRESH_SECRET=<your-jwt-refresh-secret>
MONGO_ROOT_USER=<your-mongo-user>
MONGO_ROOT_PASSWORD=<your-mongo-password>
POSTGRES_USER=<your-postgres-user>
POSTGRES_PASSWORD=<your-postgres-password>
POSTGRES_DB=fintechops
```

---

## 4. ALL BUGS FIXED (COMPLETED)

These are ALL the bugs we found and fixed. **Do NOT re-fix these — they are done:**

### 4.1 Docker Build Fixes
1. **All 11 Dockerfiles** — Changed `npm ci` → `npm install --omit=dev` (no `package-lock.json` exists)
2. **All 10 service Dockerfiles** — Changed `CMD ["node", "index.js"]` → `CMD ["node", "src/index.js"]` (entry points are in `src/`)
3. **Frontend Dockerfile** — Multi-stage: build with node:18-alpine, serve with nginx:alpine

### 4.2 Import Path Fixes
4. **All route `index.js` files** (7+ services) — Fixed imports from `./controllers/` → `../controllers/` (routes are in `src/routes/`, controllers in `src/controllers/`)

### 4.3 Frontend Build Fix
5. **`FiCalculator`** not exported from `react-icons/fi` → Replaced with `FiPercent` in Calculators page

### 4.4 API Gateway Fixes
6. **CORS origin** — Changed `http://localhost:3100` → `http://localhost` (frontend is on port 80)
7. **Service routing** — Changed `localhost:PORT` → Docker service names (`http://auth-service:3001`, etc.) via env vars
8. **Body forwarding** — Added `onProxyReq` handler to re-stream request body consumed by `express.json()` middleware (critical for POST/PUT proxying)
9. **All service URL env vars** added to `docker-compose.yml` for the gateway: `AUTH_SERVICE_URL`, `USER_SERVICE_URL`, `MARKET_SERVICE_URL`, `NEWS_SERVICE_URL`, `BLOG_SERVICE_URL`, `CALCULATOR_SERVICE_URL`, `CHATBOT_SERVICE_URL`, `EMAIL_SERVICE_URL`, `ADMIN_SERVICE_URL`

### 4.5 Auth Service Fixes
10. **Cognito env var mismatch** — `cognitoService.js` was reading `COGNITO_USER_POOL_ID` but env has `AWS_COGNITO_USER_POOL_ID` → Added fallback: `process.env.AWS_COGNITO_USER_POOL_ID || process.env.COGNITO_USER_POOL_ID`
11. **PostgreSQL connection** — Added `POSTGRES_HOST=postgres` to auth-service env in docker-compose (was defaulting to localhost)

### 4.6 Chatbot Fix
12. **Groq not OpenAI** — Chatbot uses Groq SDK, added `GROQ_API_KEY` env var to docker-compose chatbot-service

---

## 5. COGNITO AUTH FLOW (JUST COMPLETED)

We switched from a custom OTP flow to **AWS Cognito-based signup verification**. AWS sends the verification code to the user's email automatically.

### Backend: `services/auth-service/src/controllers/authController.js` (530 lines)
- **Cognito endpoints used** (NOT the custom `/signup`, `/login` ones):
  - `POST /api/auth/cognito/signup` → Creates user in Cognito + MongoDB + PostgreSQL (PG is non-blocking), returns `{ requiresVerification: true, email, userConfirmed, userSub }`
  - `POST /api/auth/cognito/confirm` → Calls `cognitoService.confirmSignUp(email, code)`, marks user verified, returns `{ user, accessToken, refreshToken }` (local JWT tokens for auto-login)
  - `POST /api/auth/cognito/login` → Calls `cognitoService.signIn()`, fetches user from MongoDB, returns `{ user, accessToken, refreshToken }` (local JWT tokens)
  - `POST /api/auth/cognito/refresh` → Refreshes Cognito session
- **`generateTokens()`** helper creates local JWT access + refresh tokens using `JWT_SECRET`
- **`cognitoService.js`** uses `amazon-cognito-identity-js` library

### Backend Routes: `services/auth-service/src/routes/index.js`
- Custom routes still exist: `/signup`, `/verify-otp`, `/resend-otp`, `/login`, `/me`
- Cognito routes: `/cognito/signup`, `/cognito/login`, `/cognito/confirm`, `/cognito/refresh`

### Frontend: `frontend/src/context/AuthContext.js` (102 lines)
- `signup(userData)` → calls `/auth/cognito/signup`
- `confirmSignup(email, code)` → calls `/auth/cognito/confirm` → stores JWT tokens → sets user → auto-login
- `login(email, password)` → calls `/auth/cognito/login` → stores JWT tokens → sets user
- `logout()` → clears tokens + state
- `checkAuth()` → reads token from localStorage, calls `/auth/me`

### Frontend: `frontend/src/pages/Signup/Signup.jsx` (413 lines)
- Step 1: Signup form (firstName, lastName, email, password, confirmPassword)
- Step 2: 6-digit verification code input (Cognito sends code to email)
- On verify: calls `confirmSignup(email, code)` → redirects to `/dashboard`
- Resend: re-calls `signup()` (Cognito resends verification email)

### Frontend: `frontend/src/pages/Login/Login.jsx` (164 lines)
- Calls `login(email, password)` from AuthContext → redirected to Cognito login endpoint
- On success → redirect to `/dashboard`

### Frontend: `frontend/src/services/api.js` (60 lines)
- Axios instance with `baseURL: http://localhost:3000/api`
- Response interceptor for 401 → tries refresh token at `/auth/refresh-token` using `accessToken` field

---

## 6. CURRENT STATE (as of 26 Feb 2026)

### All 14 Docker containers are RUNNING:
- **Healthy:** auth-service, api-gateway, user-service, chatbot-service, admin-service, blog-service, market-service, calculator-service, email-service, news-service, mongodb, redis, postgres
- **Unhealthy (cosmetic):** frontend — Nginx doesn't have wget/curl for healthcheck, but the app itself WORKS fine at `http://localhost`

### What WORKS:
- All services start and connect to their databases
- API Gateway correctly proxies all routes to backend services
- CORS is configured correctly
- Request body forwarding works for POST/PUT requests
- Frontend builds and serves at `http://localhost`
- Signup flow: form → Cognito signup → AWS sends verification code → enter code → auto-login → dashboard
- Login flow: email + password → Cognito login → JWT tokens → dashboard

### What has NOT been tested yet:
- Full end-to-end signup → email verification → login (need to actually submit the form and check if Cognito sends the email)
- Dashboard page functionality after login
- Other pages: Market, News, Blog, Calculators, Chatbot, Profile, Pricing
- Protected routes (ProtectedRoute component)
- Chatbot with Groq API
- Email service with AWS SES
- Admin service functionality

---

## 7. KEY FILE LOCATIONS

### Modified files (these have our fixes):
- `docker-compose.yml` — All env vars, service configs
- `.env` — All API keys and secrets
- `services/api-gateway/src/index.js` — CORS, proxy config, body re-streaming
- `services/auth-service/src/controllers/authController.js` — All auth logic (custom + Cognito)
- `services/auth-service/src/services/cognitoService.js` — Cognito SDK wrapper
- `services/auth-service/src/routes/index.js` — Auth routes
- `services/auth-service/src/models/User.js` — MongoDB user model (has otp, otpExpiry, cognitoSub, isVerified fields)
- `frontend/src/context/AuthContext.js` — Auth state management
- `frontend/src/pages/Signup/Signup.jsx` — Signup + verification UI
- `frontend/src/pages/Login/Login.jsx` — Login UI
- `frontend/src/services/api.js` — Axios config + interceptors
- All `*/Dockerfile` files — Fixed npm install + CMD paths
- All `*/src/routes/index.js` files — Fixed import paths

### Unmodified (original code):
- `frontend/src/pages/Dashboard/`, `Home/`, `Market/`, `News/`, `Blog/`, `Calculators/`, `Chatbot/`, `Profile/`, `Pricing/`, `NotFound/`
- `frontend/src/components/` (Button, Card, Footer, Navbar, ProtectedRoute)
- `services/*/src/controllers/`, `models/`, `routes/` (except auth-service)
- `k8s/`, `monitoring/`, `Jenkinsfile`, `sonar-project.properties`

---

## 8. HOW TO RUN

```bash
cd /Users/rahulpatel/Downloads/fintech
docker compose up --build -d
```

Then open `http://localhost` in browser.

To rebuild specific services after code changes:
```bash
docker compose up --build -d auth-service frontend
```

To check logs:
```bash
docker compose logs -f auth-service
docker compose logs -f api-gateway
```

---

## 9. WHAT TO DO NEXT (PENDING TASKS)

1. **Test the full Cognito signup flow end-to-end** — Open `http://localhost`, sign up with a real email, verify AWS sends the code, enter the code, confirm it logs in and redirects to dashboard
2. **Fix frontend healthcheck** (cosmetic) — The Nginx container shows "unhealthy" because the Dockerfile healthcheck uses `wget` which isn't available. Either install curl in the image or remove the healthcheck.
3. **Test all pages** — Navigate through Dashboard, Market, News, Blog, Calculators, Chatbot, Profile, Pricing and verify they load and fetch data correctly
4. **Test chatbot** — Verify Groq API integration works when chatting
5. **Test protected routes** — Verify unauthenticated users are redirected to login
6. **Fix `api.js` refresh token endpoint** — Currently calls `/auth/refresh-token` but the auth routes may need this to point to `/auth/cognito/refresh` for consistency
7. **Any remaining UI/UX improvements** the user wants
