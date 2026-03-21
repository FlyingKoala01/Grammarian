# Coding Standards

## Main Rule
Write code that is easy to understand, change, and debug.

## Core Principles
### Readability first
Favor code that another developer can understand quickly.

### Keep functions cohesive
Avoid microfunctions that fragment logic without real benefit. A function should represent a meaningful unit of behavior.

### Do not over-type
Use TypeScript to clarify contracts and catch errors. Do not create layers of types that obscure the code.

### Prefer explicit domain language
Use names tied to the problem space:
- studySession
- reviewQueue
- correctionResult
- exerciseVariant

Avoid vague names like:
- data
- itemManager
- processThing
- helperUtils

## Function Design
Good functions:
- do one coherent job
- have clear inputs and outputs
- are readable top to bottom
- avoid hidden side effects

Avoid:
- deep nesting when guard clauses help
- long chains of indirection
- extraction of tiny wrappers with little semantic value

## Component Design
React components should:
- have one visible responsibility
- keep rendering readable
- avoid embedding business rules
- extract subcomponents when the UI becomes hard to scan

Do not split components too aggressively. A few well-structured medium-sized components are often better than many tiny ones.

## TypeScript Guidelines
- prefer inferred local types when obvious
- define types at domain boundaries
- use interfaces or type aliases consistently
- avoid deeply nested generic abstractions unless truly justified
- model real concepts, not hypothetical future concepts

## Patterns to Encourage
Use these where they add clarity:
- service layer
- adapter pattern for LLM providers
- strategy pattern for exercise variants
- schema validation at boundaries
- composition over inheritance

## Patterns to Avoid
- abstract base layers with one implementation
- generic manager classes
- premature factory hierarchies
- dependency injection complexity without clear need
- utility files that become dumping grounds

## Comments
Write comments for:
- non-obvious decisions
- tradeoffs
- constraints
- rationale

Do not write comments that simply restate code.

## File Organization
- group files by feature or domain
- keep related code close together
- avoid giant shared folders with weak cohesion
- split files when the file becomes hard to navigate, not because of arbitrary line counts

## Error Handling
- handle expected failure modes intentionally
- surface user-friendly messages where appropriate
- keep logs useful and contextual
- never swallow errors silently

## Testing
Test behavior that matters:
- scoring
- scheduling
- exercise state transitions
- correction normalization
- permission and auth logic

Do not over-invest in brittle implementation-detail tests.

## LLM-Specific Rules
- keep prompts versioned or centrally managed
- normalize provider responses before use
- validate structured outputs
- never trust model output blindly
- log enough for debugging without leaking sensitive data

## Code Review Expectations
A change is ready when:
- the purpose is clear
- the structure fits the architecture
- naming is strong
- complexity is justified
- tests cover important behavior
- the code is readable without excessive explanation
