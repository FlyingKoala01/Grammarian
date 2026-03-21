# Data Model

## Purpose
This document defines a practical first-version data model for the Chinese study application.

It is designed to support:
- standardized storage of learning content
- exercise generation
- answer correction
- revision scheduling
- learner progress tracking
- LLM-assisted explanations and variations

The model should stay readable and implementation-friendly. It is not meant to become an academic linguistic system or an over-abstracted schema.

## Modeling Principles

### Model the learning domain, not just the UI
The data model should represent what the learner studies, what the system generates, and how the learner performs over time.

### Separate canonical content from generated content
Keep stored learning content separate from exercise instances and learner submissions.

### Prefer explicit entities over vague JSON blobs
Some metadata can stay flexible, but the core concepts should be first-class entities.

### Avoid speculative complexity
Only include fields and relationships that support real product behavior.

## Main Entity Groups
The system is easiest to understand if grouped into five areas:

1. content entities
2. exercise entities
3. learner activity entities
4. revision and progress entities
5. LLM support entities

---

# 1. Content Entities

## Character
Represents a single Chinese character.

### Purpose
Used for:
- character recognition exercises
- pinyin exercises
- writing exercises
- linking words and sentences

### Suggested Fields
```ts
type Character = {
  id: string
  simplified: string
  traditional?: string | null
  pinyinCanonical: string
  pinyinNormalized?: string | null
  primaryTranslation: string
  alternativeTranslations?: string[]
  meaningNotes?: string | null
  writingNotes?: string | null
  radicals?: string[]
  difficultyLevel?: number | null
  source: "user_added" | "curated" | "imported" | "llm_assisted"
  status: "active" | "archived"
  createdAt: string
  updatedAt: string
}
```

### Notes
- `simplified` should be required for the first version if the product is simplified-Chinese-first.
- `traditional` can stay optional.
- `pinyinCanonical` should follow one chosen standard consistently.

## Word
Represents one or more characters forming a word or expression.

### Purpose
Used for:
- translation recognition
- pinyin recognition
- writing exercises
- gap-fill exercises
- sentence linking

### Suggested Fields
```ts
type Word = {
  id: string
  simplified: string
  traditional?: string | null
  pinyinCanonical: string
  pinyinNormalized?: string | null
  primaryTranslation: string
  alternativeTranslations?: string[]
  partOfSpeech?: string | null
  usageNotes?: string | null
  difficultyLevel?: number | null
  source: "user_added" | "curated" | "imported" | "llm_assisted"
  status: "active" | "archived"
  createdAt: string
  updatedAt: string
}
```

### Notes
- Keep `partOfSpeech` optional. It is useful but should not block content creation.
- A word may link to multiple characters.

## Sentence
Represents a sentence used for understanding and contextual exercises.

### Purpose
Used for:
- sentence understanding
- gap-fill generation
- vocabulary-in-context practice
- grammar examples

### Suggested Fields
```ts
type Sentence = {
  id: string
  simplified: string
  traditional?: string | null
  pinyinCanonical?: string | null
  translationPrimary: string
  translationAlternatives?: string[]
  meaningNotes?: string | null
  grammarNotes?: string | null
  difficultyLevel?: number | null
  source: "user_added" | "curated" | "imported" | "llm_assisted"
  status: "active" | "archived"
  createdAt: string
  updatedAt: string
}
```

### Notes
- Sentence-level pinyin can remain optional at first.
- Keep room for multiple translations.

## GrammarConcept
Represents a grammar point, pattern, or language concept.

### Purpose
Used for:
- linked explanations
- grammar-focused exercises
- sentence understanding support
- ask-the-tutor context

### Suggested Fields
```ts
type GrammarConcept = {
  id: string
  title: string
  summary: string
  explanation?: string | null
  patternExample?: string | null
  commonMistakes?: string | null
  difficultyLevel?: number | null
  source: "user_added" | "curated" | "imported" | "llm_assisted"
  status: "active" | "archived"
  createdAt: string
  updatedAt: string
}
```

## LearnerNote
Represents a user-authored note or memory aid.

### Purpose
Used for:
- personalized explanations
- study support
- contextual tutoring

### Suggested Fields
```ts
type LearnerNote = {
  id: string
  userId: string
  targetType: "character" | "word" | "sentence" | "grammar_concept"
  targetId: string
  note: string
  createdAt: string
  updatedAt: string
}
```

---

# 2. Content Relationship Entities

## WordCharacterLink
Links a word to the characters it contains.

```ts
type WordCharacterLink = {
  id: string
  wordId: string
  characterId: string
  position: number
}
```

## SentenceWordLink
Links a sentence to the words it contains.

```ts
type SentenceWordLink = {
  id: string
  sentenceId: string
  wordId: string
  position?: number | null
}
```

## SentenceGrammarLink
Links a sentence to grammar concepts it illustrates.

```ts
type SentenceGrammarLink = {
  id: string
  sentenceId: string
  grammarConceptId: string
}
```

## ContentTag
Optional tagging for filtering and generation constraints.

```ts
type ContentTag = {
  id: string
  label: string
}
```

## ContentTagLink
Allows tags to be attached to different item types.

```ts
type ContentTagLink = {
  id: string
  targetType: "character" | "word" | "sentence" | "grammar_concept"
  targetId: string
  tagId: string
}
```

### Tag Examples
- hsk1
- travel
- measure_words
- beginner
- review_priority

Do not make tags carry core business meaning. They should support filtering, not replace structure.

---

# 3. User and Learning Ownership Entities

## User
Represents the learner.

```ts
type User = {
  id: string
  email: string
  displayName?: string | null
  preferredScript?: "simplified" | "traditional" | null
  preferredPinyinFormat?: "tone_marks" | "tone_numbers" | null
  createdAt: string
  updatedAt: string
}
```

## UserLearningItem
Represents the fact that a user is studying a given content item.

### Purpose
This is one of the most important entities in the system.

It separates:
- global content in the database
from
- what a specific user is actually studying

```ts
type UserLearningItem = {
  id: string
  userId: string
  itemType: "character" | "word" | "sentence" | "grammar_concept"
  itemId: string
  origin: "manual_add" | "imported_set" | "lesson" | "llm_suggested"
  isActive: boolean
  addedAt: string
  updatedAt: string
}
```

### Why it matters
A word can exist globally without belonging to a learner’s active study set.

---

# 4. Exercise Entities

## ExerciseTemplate
Represents a reusable exercise pattern.

### Purpose
Defines the pedagogical structure, not a specific generated question.

### Example Templates
- show word, ask for translation
- show hanzi, ask for pinyin
- show translation, ask for word in hanzi
- show sentence, ask for interpretation
- show sentence with one missing word

```ts
type ExerciseTemplate = {
  id: string
  code:
    | "character_recognition"
    | "pinyin_recognition"
    | "character_writing"
    | "sentence_understanding"
    | "gap_fill"
  title: string
  description?: string | null
  answerMode: "multiple_choice" | "short_text" | "free_text" | "mixed"
  isLLMGenerated: boolean
  isActive: boolean
  createdAt: string
  updatedAt: string
}
```

## ExerciseInstance
Represents one actual exercise shown to a learner.

### Purpose
Stores the generated content and the answer expectations at the moment the exercise was created.

```ts
type ExerciseInstance = {
  id: string
  userId: string
  templateId: string
  targetType: "character" | "word" | "sentence" | "grammar_concept"
  targetId: string
  promptText: string
  promptDataJson?: string | null
  correctAnswerJson: string
  acceptedAnswersJson?: string | null
  explanationReferenceJson?: string | null
  difficultyLevel?: number | null
  source: "deterministic" | "llm_generated" | "hybrid"
  generationVersion?: string | null
  generatedAt: string
  expiresAt?: string | null
}
```

### Why store `correctAnswerJson`
This allows the system to freeze the expected answer shape even if content changes later.

### Examples of `correctAnswerJson`
- a single correct translation
- a canonical pinyin value
- a required hanzi word
- a structured expected interpretation record

## ExerciseOption
Represents options for multiple-choice exercises.

```ts
type ExerciseOption = {
  id: string
  exerciseInstanceId: string
  optionText: string
  isCorrect: boolean
  position: number
}
```

---

# 5. Submission and Correction Entities

## Submission
Represents the learner’s answer to one exercise instance.

```ts
type Submission = {
  id: string
  userId: string
  exerciseInstanceId: string
  submittedAnswerText?: string | null
  submittedAnswerJson?: string | null
  submittedAt: string
}
```

## CorrectionResult
Represents the evaluation of a submission.

### Purpose
Stores both correctness and educational feedback.

```ts
type CorrectionResult = {
  id: string
  submissionId: string
  evaluationMode: "deterministic" | "llm_assisted" | "hybrid"
  isCorrect: boolean
  score?: number | null
  normalizedAnswer?: string | null
  idealAnswer?: string | null
  acceptedVariantMatched?: string | null
  feedbackShort?: string | null
  feedbackDetailed?: string | null
  mistakeType?: string | null
  llmVersion?: string | null
  createdAt: string
}
```

### Mistake Type Examples
- wrong_tone
- wrong_character
- wrong_meaning
- incomplete_translation
- grammar_misunderstanding
- wrong_word_choice

### Why this matters
This gives the product enough data to:
- show useful correction
- identify repeated learner mistakes
- improve revision targeting later

---

# 6. Revision and Progress Entities

## ReviewSchedule
Represents when a learner should review a given learning item again.

```ts
type ReviewSchedule = {
  id: string
  userId: string
  itemType: "character" | "word" | "sentence" | "grammar_concept"
  itemId: string
  nextReviewAt: string
  lastReviewedAt?: string | null
  reviewCount: number
  successCount: number
  failureCount: number
  stabilityScore?: number | null
  difficultyScore?: number | null
  createdAt: string
  updatedAt: string
}
```

### Notes
Do not let the LLM own revision scheduling. This should remain deterministic.

## ProgressSnapshot
Represents an aggregated learning summary for reporting or dashboards.

```ts
type ProgressSnapshot = {
  id: string
  userId: string
  snapshotDate: string
  activeItemsCount: number
  reviewedItemsCount: number
  correctSubmissionCount: number
  incorrectSubmissionCount: number
  generatedAt: string
}
```

This can be computed periodically instead of updated live on every action if needed.

---

# 7. LLM Support Entities

## PromptTemplate
Represents a versioned prompt used for generation or correction.

```ts
type PromptTemplate = {
  id: string
  code: string
  purpose: "exercise_generation" | "answer_correction" | "tutor_response"
  version: string
  templateText: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}
```

## LLMInteractionLog
Represents a stored record of an LLM call.

```ts
type LLMInteractionLog = {
  id: string
  userId?: string | null
  purpose: "exercise_generation" | "answer_correction" | "tutor_response"
  model: string
  promptTemplateId?: string | null
  requestPayloadJson: string
  responsePayloadJson?: string | null
  status: "success" | "failed" | "rejected"
  errorMessage?: string | null
  createdAt: string
}
```

### Important Rule
Do not store unnecessary sensitive user data in these logs. Keep them useful for debugging and auditing without becoming risky.

---

# 8. Tutor Entities

## TutorConversation
Represents a learner conversation with the tutoring assistant.

```ts
type TutorConversation = {
  id: string
  userId: string
  title?: string | null
  createdAt: string
  updatedAt: string
}
```

## TutorMessage
Represents one message in a tutor conversation.

```ts
type TutorMessage = {
  id: string
  conversationId: string
  role: "user" | "assistant" | "system"
  messageText: string
  linkedItemType?: "character" | "word" | "sentence" | "grammar_concept" | null
  linkedItemId?: string | null
  createdAt: string
}
```

This can help answer questions in context of the learner’s actual study material.

---

# 9. Recommended First-Version Scope

## Keep in v1
The following entities are strong first-version candidates:
- User
- Character
- Word
- Sentence
- GrammarConcept
- UserLearningItem
- ExerciseTemplate
- ExerciseInstance
- ExerciseOption
- Submission
- CorrectionResult
- ReviewSchedule
- LearnerNote

## Optional for slightly later
These can be added once the core loop works:
- ProgressSnapshot
- PromptTemplate
- LLMInteractionLog
- TutorConversation
- TutorMessage
- ContentTag and ContentTagLink

---

# 10. Relationship Overview

## Core relationships
- one word contains many characters
- one sentence contains many words
- one sentence can illustrate many grammar concepts
- one user studies many learning items
- one learning item can generate many exercise instances
- one exercise instance has many submissions over time only if reused, or one if single-use
- one submission has one correction result
- one user has one review schedule per learning item

## Practical rule
Do not force every relationship to be fully normalized on day one if it slows delivery too much. But the main boundaries should still be kept clear.

---

# 11. Example Entity Flow

## Example: user adds a new word
User adds:
- hanzi: 学习
- pinyin: xue2 xi2
- translation: to study

This creates or uses:
- `Word`
- optional `WordCharacterLink` to 学 and 习
- `UserLearningItem`
- `ReviewSchedule`

Then the system may generate:
- `ExerciseInstance` using `character_recognition`
- `ExerciseInstance` using `pinyin_recognition`
- `ExerciseInstance` using `character_writing`

The learner answers:
- `Submission`

The system evaluates:
- `CorrectionResult`

The learner’s revision timing updates:
- `ReviewSchedule`

---

# 12. ORM Design Notes

## General advice
Whether using Prisma or Drizzle:
- keep table names clear
- avoid deeply generic polymorphism everywhere
- use enums where they add clarity
- use JSON columns selectively for structured generated payloads
- keep core canonical content in normal columns

## Good JSON candidates
JSON can be useful for:
- `promptDataJson`
- `correctAnswerJson`
- `acceptedAnswersJson`
- `requestPayloadJson`
- `responsePayloadJson`

## Avoid overusing JSON for
- core learning content
- key filtering fields
- primary relationships
- revision scheduling data

---

# 13. Validation Rules

## At content creation time
Validate:
- required fields for the chosen item type
- canonical pinyin format
- non-empty translations
- safe and valid Chinese text input
- relationship consistency where applicable

## At exercise generation time
Validate:
- target item exists
- target item belongs to learner if required
- generated exercise matches template type
- answer payload is well formed

## At correction time
Validate:
- submission belongs to exercise instance
- expected answer format is available
- deterministic comparison runs first where possible
- LLM fallback only runs when needed

---

# 14. Naming Guidance

Use names that reflect the domain:
- `userLearningItem`
- `reviewSchedule`
- `exerciseInstance`
- `correctionResult`

Avoid vague names like:
- `entityData`
- `studyThing`
- `exerciseManager`
- `contentObject`

---

# 15. Summary
A good first data model for this product should separate:

- canonical learning content
- user-owned study state
- generated exercises
- learner submissions
- correction feedback
- revision scheduling
- optional LLM metadata

The most important implementation concept is this:

**the learner studies structured items, the system generates exercises from those items, and the learner’s performance updates revision state over time.**

That structure is enough to support the first five exercise types cleanly:
1. character recognition and translation
2. pinyin recognition
3. character writing
4. sentence understanding
5. filling the gaps
