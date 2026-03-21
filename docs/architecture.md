# Architecture

## Overview
The system should be structured as a web application with a clear frontend/backend split and a dedicated LLM integration boundary.

Recommended high-level architecture:
- frontend web app for study flows and progress views
- backend API for business logic and persistence
- database for user progress, study content, and session history
- LLM integration layer for generation, correction, and tutoring
- shared TypeScript models only where they improve clarity

## Architectural Goals
- keep the product easy to evolve
- separate domain logic from transport and UI details
- isolate external integrations
- support testability
- remain compatible with mobile export through Capacitor

## Suggested Structure
```text
apps/
  web/
    src/
      app/
      features/
      components/
      hooks/
      lib/
  api/
    src/
      routes/
      controllers/
      services/
      repositories/
      domain/
      llm/
      middleware/
      lib/

packages/
  shared/
  ui/
  config/
```

## Frontend Architecture
Organize by feature rather than by file type alone.

Suggested feature areas:
- auth
- dashboard
- study
- revision
- submissions
- corrections
- tutor
- settings

Within each feature, keep a practical structure:
```text
features/study/
  components/
  hooks/
  api/
  types.ts
  utils.ts
  StudySessionPage.tsx
```

Guidelines:
- keep page components focused on orchestration
- keep reusable UI components generic and simple
- avoid putting business rules directly in components
- centralize server communication by feature or API client layer

## Backend Architecture
Use a layered approach.

### Routes
Define endpoints and attach middleware.

### Controllers
Translate HTTP requests into service calls. Controllers should stay thin.

### Services
Contain application logic and orchestrate repositories, domain logic, and LLM adapters.

### Repositories
Encapsulate data access where useful. If the ORM is expressive enough, repository usage can stay selective rather than mandatory everywhere.

### Domain
Contain meaningful domain models and pure business rules such as exercise scoring, revision scheduling decisions, or progression logic.

### LLM Module
Contain provider adapters, prompt templates, result normalization, and safety guards.

## Request Flow
A typical request should look like:
1. request enters route
2. request is validated
3. controller calls service
4. service loads domain data
5. service applies business logic
6. service calls LLM adapter if needed
7. service persists result
8. controller returns normalized response

## LLM Boundary
All provider usage must be isolated behind clear interfaces.

Possible interface shape:
- `ExerciseGenerator`
- `AnswerCorrector`
- `TutorResponder`

This makes it easier to:
- swap providers
- test with mocks
- version prompts
- track costs and failures
- keep prompt engineering out of unrelated code

## Deterministic vs LLM Logic
Use deterministic logic for:
- exact answer checks where rules are clear
- spaced repetition scheduling
- user progression metrics
- content retrieval and filtering

Use LLM-based logic for:
- exercise diversification
- open-answer correction
- explanation generation
- natural-language Q&A

## Data Model Direction
Main entities may include:
- User
- StudyItem
- ExerciseTemplate
- ExerciseInstance
- StudySession
- Submission
- Correction
- ReviewSchedule
- ProgressRecord
- TutorMessage

Keep the model aligned with learning behavior, not only with UI screens.

## API Design Guidelines
- use resource-oriented route naming
- keep payloads explicit
- version if needed when contracts become large
- validate all input at the boundary
- return structured errors
- keep response shapes predictable

## Error Handling
Plan for:
- validation errors
- auth errors
- missing resources
- LLM timeout/failure
- malformed provider outputs
- retryable downstream failures

LLM failures should degrade gracefully when possible.

## Testing Strategy
### Unit tests
For:
- revision scheduling
- scoring rules
- prompt result normalization
- service-level branching logic

### Integration tests
For:
- API endpoints
- ORM-backed workflows
- main study session flows

### End-to-end tests
For:
- onboarding
- completing exercises
- viewing corrections
- asking the tutor

## Android Export Considerations
Because the web app may be exported with Capacitor:
- keep frontend routing compatible with mobile packaging
- avoid browser-only assumptions where possible
- validate storage and auth flows on mobile
- prefer responsive layouts from the start

## Evolution Guidelines
Start simple. Extract packages or deeper abstractions only when:
- multiple features genuinely share logic
- duplication creates maintenance cost
- a boundary becomes stable and valuable
