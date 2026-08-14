# Nexora Quiz API Contract

This document defines the REST API the Node.js + TypeScript backend should provide. The frontend currently ships with local JSON-shaped data in `lib/questions.ts`; replace that source with these endpoints when the API is available. The server is the authority for sessions, answer validation, and scores.

Base URL: `NEXT_PUBLIC_API_URL` (example: `http://localhost:4000/api`)

## Shared types

```ts
type Difficulty = "easy" | "medium" | "hard" | "expert";
type AnswerStatus = "correct" | "incorrect" | "unanswered";

interface Category {
  id: string; slug: string; name: string; description?: string;
  icon?: string; active: boolean; questionCount?: number;
}
interface Question {
  id: string; categoryId: string; question: string; difficulty: Difficulty;
  // `answer` and `acceptedAnswers` are never returned in game-play requests.
  explanation?: string;
}
```

All validation errors return `400` with `{ "error": { "code": "INVALID_INPUT", "message": "...", "fields": {} } }`. Use `404` for missing IDs and `409` for an invalid/finished session state.

## Categories and questions

### `GET /categories`

Returns active categories, including the count of active questions. Optional query: `includeInactive=true` (administrator only).

### `GET /questions?categoryId=<id>&difficulty=<difficulty>&limit=50&cursor=<cursor>`

Administrator/listing endpoint. Paginated and authenticated when answers or inactive records are requested. Never expose answer fields to unauthenticated clients.

### `POST /questions/random`

Starts no state; validates availability and returns unique, shuffled, answer-redacted questions. This is useful for previews but a real round should use `POST /quiz/start`.

```json
{ "categoryId": "mathematics", "count": 10, "difficulty": "mixed" }
```

Returns `409 QUESTION_COUNT_UNAVAILABLE` with `availableCount` when there are insufficient questions.

## Quiz lifecycle

### `POST /quiz/start`

Creates a server-owned quiz session and selects unique questions.

```json
{ "playerName": "Flynn", "categoryId": "mathematics", "questionCount": 10, "timePerQuestionSeconds": 30, "difficulty": "mixed" }
```

Returns:

```json
{
  "sessionId": "qs_...", "player": { "id": "...", "name": "Flynn" },
  "category": { "id": "mathematics", "name": "Mathematics" },
  "questionCount": 10, "timePerQuestionSeconds": 30,
  "questions": [{ "id": "math-001", "question": "What is 15% of 200?", "difficulty": "easy" }],
  "startedAt": "2026-08-14T12:00:00.000Z"
}
```

The backend stores the question IDs/order, starts the session clock, and must never return correct answers here.

### `POST /quiz/:sessionId/answer`

Submits one answer. The server verifies the question belongs to the active session, has not been answered, and is within its permitted timer window. An omitted or empty answer is recorded as `unanswered`.

```json
{ "questionId": "math-001", "answer": "30", "clientSubmittedAt": "2026-08-14T12:00:17.000Z" }
```

Returns immediate feedback:

```json
{ "questionId": "math-001", "status": "correct", "pointsAwarded": 10, "score": 10, "correctAnswer": "30", "explanation": "0.15 × 200 = 30.", "answeredAt": "..." }
```

`correctAnswer` should be returned only after the answer has been finalized. The server normalizes case and whitespace, supports deterministic accepted aliases/numeric equivalence, and owns all point calculations.

### `POST /quiz/:sessionId/complete`

Finalizes an active session. Remaining questions become unanswered. This endpoint is idempotent and returns the final result.

```json
{ "clientCompletedAt": "2026-08-14T12:05:00.000Z" }
```

```json
{ "sessionId": "qs_...", "status": "completed", "score": 80, "maxScore": 100, "correct": 8, "incorrect": 1, "unanswered": 1, "accuracy": 80, "totalTimeSeconds": 300, "completedAt": "..." }
```

### `GET /quiz/history?playerId=<id>&limit=20&cursor=<cursor>`

Authenticated user history, newest first. Returns session summaries and pagination metadata.

### `GET /quiz/:sessionId`

Returns the current owner’s resumable session state. Do not expose unanswered correct answers.

## Administration (future, protected)

- `POST /admin/categories`, `PATCH /admin/categories/:id`
- `POST /admin/questions`, `PATCH /admin/questions/:id`, `DELETE /admin/questions/:id`

Question write shape: `{ categoryId, question, answer, acceptedAnswers?, explanation?, difficulty, active? }`. Persist MongoDB `createdAt` and `updatedAt`; use an immutable `id`/`_id` and indexes on `{ categoryId, active, difficulty }`.

## Required backend safeguards

- Validate player name length, category, count, difficulty, IDs, and timer range (recommended: 10–300 seconds).
- Rate-limit quiz start/answer endpoints and apply normal JSON body-size limits.
- Keep answers and score calculation server-side; never trust client score, correct count, or elapsed time.
- Store question snapshots or version IDs in sessions so later edits do not change historical results.
- Use environment variables such as `MONGODB_URI`, `PORT`, `CORS_ORIGIN`, and `JWT_SECRET` (when accounts are introduced).
