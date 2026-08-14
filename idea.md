# Nexora — Frontend Product Plan

This is the working product plan for the Next.js frontend. It records the original game vision, what is currently implemented locally, what needs backend integration, and the future roadmap. For request/response payloads, validation rules, and MongoDB/API ownership, use [endpoints.md](./endpoints.md).

## Product vision

Nexora is a fast, game-like knowledge training experience: a player enters their name, selects a subject, question count, and time limit, then answers typed-response questions against the clock. Each round should feel rewarding, educational, and worth replaying.

The initial subjects are Mathematics, Coding, and Computer Science. Categories, questions, difficulty, and modes must remain extensible without requiring a frontend rewrite.

## Current frontend MVP — completed

### Game experience

- [x] Landing screen with a prominent Play Now action and game-focused visual design.
- [x] Player-name entry.
- [x] Category selection for Mathematics, Coding, and Computer Science.
- [x] Question-count presets: 5, 10, 15, and 20.
- [x] Custom question count with a clear availability error when the category has too few questions.
- [x] Timer presets: 10, 15, 30, 45, and 60 seconds.
- [x] Custom timer duration, validated between 10 and 300 seconds.
- [x] Randomized question order with no repeat within a local quiz session.
- [x] Typed-answer input; no multiple-choice options.
- [x] Per-question visual countdown that resets for each question and becomes urgent near zero.
- [x] Automatic timeout submission as unanswered, followed by the next question.
- [x] Deterministic answer checking: case-insensitive, whitespace-normalized, accepted answer aliases, and practical numeric equivalence such as `30` and `30.0`.
- [x] Ten points for a correct answer; no points for incorrect or unanswered answers.
- [x] Immediate positive/correct and encouraging incorrect/unanswered feedback, including explanations where supplied.
- [x] Current score, question number, total, progress bar, and remaining-question display.
- [x] Results with final score, correct/incorrect/unanswered totals, accuracy, category, elapsed time, and performance message.
- [x] Play Again and Home actions.

### Data and architecture

- [x] Reusable game, setup, and results components.
- [x] TypeScript types for categories, questions, difficulty, and answer records.
- [x] Built-in question bank covering the three subjects (36 questions total).
- [x] Question data is kept in a simple JSON-shaped structure with ID, category, question, answer, optional accepted answers, explanation, and difficulty.
- [x] Question selection and answer normalization are isolated in utility functions for later API replacement.
- [x] Responsive layouts for phone, tablet, and desktop use.

## MVP work still required — backend integration

The current quiz logic is intentionally local so the frontend works as a standalone prototype. Replace it with the API described in [endpoints.md](./endpoints.md) when the Node.js/TypeScript + MongoDB backend is available.

- [x] Fetch categories and question availability from `GET /categories`.
- [x] Start a server-owned session through `POST /quiz/start` instead of selecting local questions.
- [x] Submit each answer to `POST /quiz/:sessionId/answer`; use the server result for feedback and score.
- [x] Complete the quiz through `POST /quiz/:sessionId/complete`; use the returned result screen summary.
- [ ] Support restoring an in-progress quiz through `GET /quiz/:sessionId`.
- [ ] Show authenticated player quiz history from `GET /quiz/history` once accounts exist.
- [x] Move the built-in question bank from the local source into MongoDB, while retaining a JSON import/seed workflow.
- [ ] Add frontend loading, empty, retry, network-error, and expired-session states for API requests.
- [x] Read the API base URL from `NEXT_PUBLIC_API_URL`; do not expose server secrets in the frontend.
- [x] Make backend validation authoritative: scores, timers, question ownership, and answers must never be trusted from browser state.

## Content improvements

- [ ] Expand each default category substantially so 15- and 20-question games provide more variety across many rounds.
- [ ] Add more explanations, accepted answer variants, and a reviewed difficulty value to every question.
- [x] Provide a JSON import format and administrator dashboard for question contributors. Export remains future work.
- [ ] Add a difficulty selector: Easy, Medium, Hard, Expert, and Mixed.
- [ ] Add additional subjects, beginning with Physics, Chemistry, Biology, History, Geography, Economics, General Knowledge, English, Logic, Electronics, Networking, AI/ML, and Cybersecurity.

## Future frontend features

### Accounts and personal progress

- [ ] Sign up, sign in, sign out, and account recovery.
- [ ] Player profile with total points, quiz history, accuracy, best score, favorite categories, and learning streaks.
- [ ] Personal dashboard and progress visualizations.

### Motivation and competition

- [ ] Global, category, daily, weekly, and monthly leaderboards.
- [ ] Achievements: First Quiz, 10 Correct, 100 Points, Perfect Score, Speed Demon, Math Master, Coding Master, and CS Master.
- [ ] XP, levels, ranks, badges, and level-up feedback.
- [ ] Daily challenge with a shared question set and leaderboard.
- [ ] Shareable friend challenges.

### Learning and game modes

- [ ] Detailed answer-review screen at the end of a round.
- [ ] Saved weak-topic review and targeted practice mode.
- [ ] Adaptive difficulty based on player performance.
- [ ] More modes, such as timed sprint, practice/no-timer, survival, and category mix.
- [ ] Optional, accessible sound effects with a visible mute preference.
- [ ] Strong-performance celebration effects that respect reduced-motion preferences.

### Social and administration

- [x] Social lobbies: guest identities, friend requests, 1v1 and team lobby creation/joining, and Socket.IO real-time room chat.
- [ ] Live shared quiz competitions and team scoring (lobby/chat foundation is complete).
- [x] Admin dashboard to create and import questions, plus protected API CRUD for questions and categories.
- [ ] Admin question/category edit and delete controls in the dashboard, and question performance statistics.
- [ ] AI-generated question proposal workflow with administrator review before publishing.

## Backend responsibilities

The frontend owns presentation, transitions, input state, and client-side convenience validation. The backend owns the source of truth:

- Category and question management.
- Question selection and no-repeat guarantees for a session.
- Timer/session validity, answer evaluation, and score calculation.
- Quiz persistence, history, player statistics, and leaderboards.
- Authentication, authorization, rate limiting, and admin access.
- MongoDB models for players, categories, questions, and quiz sessions.

See [endpoints.md](./endpoints.md) for the exact endpoint contract, error format, safeguards, and data-model guidance.

## Definition of done for backend-connected MVP

- The UI runs solely against the documented API in production.
- The backend generates sessions, evaluates answers, and calculates all scores.
- MongoDB persists categories, questions, quiz-session snapshots, and completed results.
- The frontend handles API loading and failure states gracefully.
- A player can complete a full round on mobile or desktop without duplicate questions, score manipulation, or lost feedback.
