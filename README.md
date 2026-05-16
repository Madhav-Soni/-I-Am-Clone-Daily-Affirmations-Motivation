# Affirmation App — Backend API

Express + MongoDB backend for the AI-powered wellness affirmation app.

## Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js 20+ |
| Framework | Express 4 |
| Database | MongoDB + Mongoose |
| AI Engine | OpenAI SDK (streaming) |
| Auth | JWT (access + refresh tokens) |
| Validation | express-validator |
| Security | helmet, cors, express-rate-limit |
| Logging | Winston + Morgan |
| Testing | Jest + Supertest |

---

## Getting Started

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env with your MongoDB URI and OpenAI key

# 3. Start development server
npm run dev

# 4. Run tests
npm test
```

---

## API Reference

### Auth — `/api/v1/auth`

| Method | Route | Auth | Description |
|---|---|---|---|
| `POST` | `/register` | ✗ | Register with email + password |
| `POST` | `/login` | ✗ | Login, receive access + refresh tokens |
| `POST` | `/refresh` | ✗ | Exchange refresh token for new access token |
| `POST` | `/logout` | ✓ | Revoke refresh token |
| `GET` | `/me` | ✓ | Get authenticated user profile |
| `POST` | `/onboarding` | ✓ | Save preferences, mark as onboarded |

### AI Generation — `/api/v1`

| Method | Route | Auth | Description |
|---|---|---|---|
| `POST` | `/ai/generate` | ✓ | Generate affirmation (SSE streaming) |

**Request body:**
```json
{ "category": "Confidence" }
```

**SSE Response format:**
```
data: {"type":"delta","content":"I am "}
data: {"type":"delta","content":"capable "}
data: {"type":"done","content":"I am capable of overcoming any challenge I face."}
```

### Affirmations — `/api/v1/affirmations`

| Method | Route | Auth | Description |
|---|---|---|---|
| `GET` | `/affirmations` | ✓ | List history (`?category`, `?isFavorite`, `?page`, `?limit`) |
| `GET` | `/affirmations/:id` | ✓ | Get single affirmation |
| `PATCH` | `/affirmations/:id` | ✓ | Toggle favorite |
| `DELETE` | `/affirmations/:id` | ✓ | Delete affirmation |

### Mood — `/api/v1/mood`

| Method | Route | Auth | Description |
|---|---|---|---|
| `POST` | `/mood` | ✓ | Log a mood entry |
| `GET` | `/mood` | ✓ | Get mood history (`?from`, `?to`, `?limit`) |
| `GET` | `/mood/latest` | ✓ | Get most recent mood log |

### Stats — `/api/v1/user`

| Method | Route | Auth | Description |
|---|---|---|---|
| `GET` | `/user/stats` | ✓ | Streak, usage, category breakdown, mood summary |

---

## Architecture Decisions

### Streaming
`POST /api/v1/ai/generate` uses **Server-Sent Events (SSE)**. The OpenAI response is streamed token-by-token to the client via `text/event-stream`. The affirmation is persisted to MongoDB only *after* the stream completes — so the client never waits on a DB write.

### Daily Limits
Implemented on the `User` model via `checkAndIncrementDailyLimit()`. Resets automatically each UTC day using a stored `dailyGenerationResetAt` timestamp. No cron job required.

### PII Sanitization
All user-provided text (mood notes, etc.) is stripped of emails, phone numbers, SSNs, credit card numbers, and addresses via `src/utils/piiSanitizer.js` before being sent to the OpenAI API.

### Token Rotation
Refresh tokens are stored (hashed via bcrypt on the model) and compared on each `/refresh` call. Revoked on logout.

---

## Project Structure

```
src/
├── server.js          # Entry point — DB connect + HTTP listen
├── app.js             # Express app, middleware, routes
├── config/
│   └── database.js    # Mongoose connection
├── models/
│   ├── User.js        # User schema + streak/limit methods
│   ├── Affirmation.js # Affirmation schema
│   └── MoodLog.js     # Mood log schema
├── controllers/
│   ├── authController.js
│   ├── affirmationController.js
│   ├── moodController.js
│   └── statsController.js
├── routes/
│   ├── authRoutes.js
│   ├── affirmationRoutes.js
│   └── moodRoutes.js
├── middleware/
│   ├── auth.js        # JWT protect + generateTokens
│   ├── validate.js    # express-validator chains
│   └── errorHandler.js
├── services/
│   └── openaiService.js  # Streaming + non-streaming generation
└── utils/
    ├── appError.js    # AppError class + asyncHandler
    ├── logger.js      # Winston logger
    └── piiSanitizer.js   # PII removal before AI calls
```
