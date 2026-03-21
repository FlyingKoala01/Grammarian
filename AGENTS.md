# AGENTS.md

## Purpose
This repository contains a web-based Chinese study platform. The goal is to help learners study, practice, and revise Chinese through varied exercises, feedback loops, and guided explanations.

The application should feel simple to use, academically useful, and maintainable over time. Every change in the codebase should support one or more of these goals:
- improve learning outcomes
- keep the code understandable
- support long-term product evolution
- preserve a fast and reliable user experience

## Product Summary
Users connect to the application and study Chinese through different exercise types such as:
- vocabulary recall
- sentence construction
- reading comprehension
- listening-related activities
- character recognition
- grammar drills
- spaced revision and review sessions

An LLM is used to:
- diversify exercise generation
- adapt prompts and examples to learner level
- correct open answers
- explain mistakes
- answer learner questions in context

## Technology Direction
Core stack:
- pnpm
- TypeScript
- Tailwind CSS
- shadcn/ui
- Express backend
- ORM for database access
- LLM integration layer
- Capacitor for Android export

Suggested default choices unless the team decides otherwise:
- frontend: Vite + React + TypeScript
- backend: Express + TypeScript
- ORM: Prisma or Drizzle
- database: PostgreSQL
- validation: Zod
- testing: Vitest for unit/integration, Playwright for end-to-end
- lint/format: ESLint + Prettier

## Engineering Principles
### Prefer readability over cleverness
Code should be easy to scan and understand. Use names that explain intent. Favor straightforward control flow over overly abstract patterns.

### Avoid microfunctions
Do not split logic into extremely small functions unless that split clearly improves clarity, reuse, or testability. Functions should be cohesive, not fragmented.

### Avoid excessive types
TypeScript should improve safety and clarity, not create noise. Prefer simple domain types, interfaces, and inferred types where they keep code readable.

### Use patterns when they solve a real problem
Use well-known patterns where they improve structure:
- service layer for business logic
- repository or ORM access abstraction where useful
- adapter pattern for external providers like LLMs
- factory/builder patterns only where object creation is truly complex
- strategy pattern for exercise generation or correction variants

Do not introduce patterns just to appear sophisticated.

### Keep business logic out of the UI
UI components should remain focused on presentation and interaction. Exercise rules, correction logic, spaced repetition behavior, and LLM orchestration should live in application/domain layers.

### Design for change
The product will evolve quickly. Keep the system modular enough to add:
- new exercise types
- new prompt strategies
- new correction flows
- new learner progression models
- new export targets

## Suggested Repository Shape
```text
apps/
  web/
  api/

packages/
  ui/
  shared/
  config/
  llm/
  exercises/

docs/
  product-overview.md
  architecture.md
  coding-standards.md
  setup.md
  roadmap.md
```

Alternative: start with a simpler monorepo layout and split packages only when real boundaries emerge.

## Architecture Guidance
### Frontend
Use shadcn/ui and Tailwind to build a clean, fast interface. Keep components practical and composable. Avoid over-engineered design systems early on.

Suggested frontend areas:
- auth and onboarding
- dashboard
- study session runner
- review session runner
- exercise results and correction views
- ask-the-tutor area
- settings and progress tracking

### Backend
Express should expose clear API modules around core domains:
- auth
- users
- study plans
- exercises
- sessions
- submissions
- corrections
- revision scheduling
- LLM interactions

Keep route handlers thin. Route handlers should validate input, call services, and return responses.

### LLM Integration
All LLM usage must go through a dedicated integration layer. Do not scatter provider calls across the codebase.

The LLM layer should:
- isolate provider-specific code
- support prompt versioning
- log requests safely
- allow mock implementations in tests
- support fallback behavior
- separate generation, correction, and Q&A responsibilities

### Database
Model the platform around learning state rather than just content. Key concepts likely include:
- user
- chinese item (word, hanzi, phrase, grammar point)
- exercise template
- study session
- submission
- correction
- revision schedule
- progress snapshot

## Quality Rules
Before merging work:
- code must be readable without excessive mental mapping
- names must reflect domain meaning
- duplication should be reduced where it actually hurts
- tests should cover meaningful behavior
- LLM prompts and outputs should be traceable
- error states should be handled intentionally
- comments should explain why, not restate what

## UI and UX Rules
- optimize for focused study flows
- reduce clutter
- keep one primary action per study screen
- show corrections clearly
- avoid overwhelming the learner with too much metadata
- make progress and revision status visible
- preserve mobile usability for future Capacitor packaging

## What to Avoid
- premature microservices
- unnecessary abstractions
- generic utility dumping grounds
- microfunctions with no standalone meaning
- over-modeling every possible type
- business logic hidden inside React components
- direct LLM provider calls from UI or controllers
- tightly coupling exercise generation to one provider

## Definition of Good Work
A good contribution in this repository:
- makes the learner experience better
- keeps the codebase easier to understand
- fits the architecture
- is testable
- does not introduce speculative complexity
