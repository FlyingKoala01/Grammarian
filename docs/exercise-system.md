# Exercise System Design

## Purpose
This document describes the first exercise set to support in the Chinese study application and how new words, characters, expressions, and concepts should be stored so the system and the LLM can generate useful practice from them.

The goal is to make the exercise layer:
- educationally consistent
- easy to extend
- grounded in standardized learning data
- compatible with deterministic checking where possible
- enhanced by the LLM where it adds real value

This design should stay practical. It should not become a massive linguistic framework too early.

## First Exercise Set
The initial exercise set will include:

1. Character recognition and translation
2. Pinyin recognition
3. Character writing
4. Understanding of sentences
5. Filling the gaps

These should be enough to support a strong first learning loop for beginners and intermediate learners.

## Core Product Idea
The user can introduce new material into the system:
- words
- characters
- expressions
- grammar points
- short example sentences
- concepts they want to learn

That material is then stored in a standardized format so the application can:
- schedule revision
- generate exercises
- evaluate answers
- explain mistakes
- create related examples
- answer learner questions in context

The LLM should generate exercises from structured learning data, not from vague free text alone.

## Main Design Principle
The application should distinguish between:
- source knowledge provided or approved by the user
- derived exercises generated from that knowledge
- learner performance data collected over time

This separation is important for maintainability and educational consistency.

## Learning Data Model

## Main Content Types
The stored learning material should support at least these categories:

### Character
A single hanzi with its meaning and reading information.

Examples:
- 我
- 学
- 好

### Word or Expression
A word or phrase made of one or more characters.

Examples:
- 学习
- 你好
- 没关系

### Sentence
A sentence used for reading, understanding, or exercise generation.

Examples:
- 我今天学习中文。
- 他会说一点汉语。

### Grammar Concept
A concept or structure the learner wants to study.

Examples:
- measure words
- 了 for completed action
- comparison with 比

### Learner Note or Concept Explanation
A user-provided explanation, association, or note that helps contextualize learning.

Examples:
- “了 often marks completion here”
- “这个 is like ‘this one’”

## Standardized Storage Shape
Each learning item should be stored in a normalized format with clear fields.

A practical base shape:

```json
{
  "id": "item_123",
  "type": "word",
  "hanzi": "学习",
  "pinyin": "xue2 xi2",
  "translation": "to study",
  "meaningNotes": "Used for studying or learning in general",
  "tags": ["verb", "hsk1"],
  "difficulty": 1,
  "source": "user_added",
  "status": "active"
}
```

This does not need to be the final exact schema, but the ideas matter:
- one clear item identity
- one main type
- canonical Chinese form
- canonical pinyin representation
- canonical meaning or translation
- optional notes and tags
- origin tracking

## Recommended Canonical Fields
For most item types, support the following where relevant:

- `id`
- `type`
- `hanzi`
- `simplified`
- `traditional`
- `pinyin`
- `translation`
- `translations`
- `meaningNotes`
- `examples`
- `tags`
- `difficulty`
- `source`
- `createdBy`
- `status`

Do not force every field on every item. Keep the schema adaptable by item type.

## Item-Type Specific Direction

### Character Item
Recommended fields:
- hanzi
- pinyin
- translation
- strokeHint or writingNotes
- radicals or components if useful
- examples of common words using the character

### Word or Expression Item
Recommended fields:
- hanzi
- pinyin
- translation
- wordClass where useful
- usageNotes
- example sentences
- related grammar or similar words

### Sentence Item
Recommended fields:
- hanzi
- pinyin
- translation
- segmentation if needed later
- grammarTags
- source items linked to the sentence

### Grammar Concept Item
Recommended fields:
- title
- explanation
- pattern examples
- common mistakes
- linked words and sentences

## Why Standardization Matters
If user input is stored inconsistently, exercise generation will become unreliable.

Standardization helps with:
- prompt quality
- deterministic validation
- exercise diversity
- progress tracking
- future analytics
- easier editing and moderation

The LLM should receive structured items like:
- target item
- learner level
- exercise type
- allowed vocabulary scope
- grammar focus
- past learner mistakes

That is much better than asking it to invent everything from scratch.

## User Input Flow
Users should be able to add new material in a guided way.

Suggested flow:
1. user enters a word, character, sentence, or concept
2. system asks for missing structured fields if needed
3. system normalizes the data
4. user reviews or confirms standardized form
5. item is stored
6. item becomes available for study and exercise generation

## Input Normalization Rules
When users add content, normalize carefully.

Examples:
- trim spaces
- normalize pinyin format
- separate simplified and traditional if supported
- standardize translation formatting
- tag the content type correctly
- mark whether a field is user-authored or LLM-assisted

The LLM may assist normalization, but final stored data should follow deterministic rules where possible.

## Exercise Generation Philosophy
Exercises should be generated from approved content rather than from arbitrary LLM invention.

Generation inputs should include:
- the target learning item
- related items allowed in the exercise
- learner proficiency
- desired difficulty
- desired exercise type
- language constraints
- correction expectations

This keeps exercises aligned with what the learner is actually studying.

## Exercise Type 1: Character Recognition and Translation

## Goal
Help the learner recognize a Chinese character or word and associate it with meaning.

## Typical Prompt Shapes
- show a character and ask for meaning
- show a word and ask for translation
- show several meanings and ask which matches the character
- show audio later if needed and ask for matching character

## Suitable Stored Inputs
- character item
- word item
- short expression item

## Validation Strategy
Use deterministic validation for:
- exact match against accepted translations
- multiple-choice correctness

Use LLM assistance only when:
- the learner gives a free-form paraphrase
- synonym tolerance is needed
- explanation quality matters

## Example
Target item:
```json
{
  "type": "word",
  "hanzi": "学习",
  "pinyin": "xue2 xi2",
  "translation": "to study"
}
```

Possible exercise:
- “What does 学习 mean?”

## Exercise Type 2: Pinyin Recognition

## Goal
Help the learner connect written Chinese to pronunciation.

## Typical Prompt Shapes
- show hanzi and ask for pinyin
- show several pinyin choices and ask which matches
- show pinyin and ask which character or word it corresponds to
- identify the correct tone pattern

## Suitable Stored Inputs
- character item
- word item
- sentence item for later advanced variants

## Validation Strategy
Prefer deterministic validation first:
- canonical pinyin match
- tone-aware comparison
- optional tolerant comparison with tone-number and accent-mark normalization

The LLM is not the first choice here. This area should remain mostly rule-based.

## Important Note
Pinyin checking should support normalization between representations where possible, for example:
- `ni3 hao3`
- `nǐ hǎo`

Internally, choose one canonical storage format and normalize input before comparison.

## Exercise Type 3: Character Writing

## Goal
Help the learner actively produce the correct Chinese character or word.

## Typical Prompt Shapes
- show translation and ask learner to write the character or word
- show pinyin and ask learner to write hanzi
- show sentence context and ask learner to write the missing word in hanzi

## Suitable Stored Inputs
- character item
- word item
- expression item

## Validation Strategy
Use deterministic validation for:
- exact hanzi match
- accepted variants if simplified and traditional both supported

Use LLM help only when:
- the user asks for explanation
- the system wants to explain why the answer was wrong
- a partially correct response needs educational feedback

## Important Constraint
Do not let the LLM decide the canonical correct written form if the item is already stored. The stored item must remain the source of truth.

## Exercise Type 4: Understanding of Sentences

## Goal
Help learners understand meaning, structure, and usage in context.

## Typical Prompt Shapes
- show a sentence and ask for translation
- ask what a highlighted word means in context
- ask why a grammar structure is used
- choose the best interpretation of a sentence
- ask what the sentence implies

## Suitable Stored Inputs
- sentence item
- linked word items
- linked grammar concept items

## Validation Strategy
This is a mixed area.

Use deterministic checks for:
- multiple-choice interpretation
- fixed-answer questions

Use LLM support for:
- grading free-form explanations
- judging translation quality
- generating contextual explanations
- highlighting the relevant grammar point

## Important Rule
The LLM should grade against structured context:
- original sentence
- official translation or translations
- linked grammar notes
- target vocabulary
- learner level

Without that context, correction quality will be less stable.

## Exercise Type 5: Filling the Gaps

## Goal
Help the learner retrieve vocabulary, grammar forms, or sentence structure in context.

## Typical Prompt Shapes
- remove one word from a sentence
- remove a measure word
- remove a grammar marker
- present a short sentence with one missing expression
- provide a word bank for easier variants

## Suitable Stored Inputs
- sentence item
- linked target item
- grammar concept item

## Validation Strategy
Use deterministic checks when the blank expects one known answer or a small accepted set.

Use LLM assistance when:
- multiple paraphrases are acceptable
- a sentence can be completed in several valid ways
- explanation of the learner’s mistake is needed

## Gap Design Rules
When generating gap-fill exercises:
- the blank should target a real learning objective
- the rest of the sentence should remain understandable
- difficulty should be intentional
- avoid ambiguous blanks unless ambiguity is the exercise goal

## LLM Role in Exercise Generation
The LLM is valuable for:
- creating varied sentence contexts
- producing alternative phrasing
- generating plausible distractors
- explaining mistakes
- adapting difficulty
- creating additional examples

The LLM should not be the primary source of truth for:
- canonical item data
- deterministic answer checking
- revision scheduling
- official accepted answer sets when exactness matters

## Recommended Exercise Generation Flow
A practical generation flow:

1. select target learning item
2. select exercise type
3. gather allowed supporting context
4. build structured prompt payload
5. ask LLM to produce exercise content in a structured format
6. validate the output
7. store generated exercise instance
8. present to learner
9. collect answer
10. correct using deterministic logic first, then LLM if needed

## Example Structured Prompt Payload
```json
{
  "exerciseType": "gap_fill",
  "learnerLevel": "beginner",
  "targetItem": {
    "type": "word",
    "hanzi": "喜欢",
    "pinyin": "xi3 huan1",
    "translation": "to like"
  },
  "allowedVocabulary": [
    {"hanzi": "我", "translation": "I"},
    {"hanzi": "你", "translation": "you"},
    {"hanzi": "中文", "translation": "Chinese language"}
  ],
  "constraints": {
    "maxSentenceLength": 8,
    "singleBlank": true,
    "avoidNewGrammar": true
  }
}
```

The model response should also be structured, for example with:
- prompt text
- correct answer
- accepted alternatives
- explanation
- difficulty estimate

## Correction Strategy
Correction should be layered.

### Layer 1: Deterministic checking
Use when:
- answer is exact
- accepted variants are known
- tones or writing forms can be normalized

### Layer 2: LLM-assisted review
Use when:
- the answer is open-ended
- translation has valid variation
- explanation quality matters
- partial correctness should be described

### Layer 3: Educational feedback
The final output to the user should explain:
- whether the answer is correct
- what the ideal answer is
- what was missing or mistaken
- what to remember next time

## Item Relationships
Learning items should be linkable.

Examples:
- a character belongs to several words
- a word appears in several example sentences
- a sentence illustrates a grammar concept
- a grammar concept can reference multiple patterns

These relationships help:
- generate contextual exercises
- explain answers better
- move from isolated knowledge to connected understanding

## Suggested Storage Separation
Keep these as distinct concepts in the system:

### Learning Item
Canonical stored knowledge.
Examples:
- 学习
- 我今天学习中文。
- concept of measure words

### Exercise Template
A reusable exercise pattern.
Examples:
- “show word, ask for meaning”
- “show sentence with one blank”

### Exercise Instance
A concrete generated exercise shown to one learner at one moment.

### Submission
The learner’s answer.

### Correction Result
The evaluation and explanation.

This separation is important for analytics and maintainability.

## Content Safety and Quality
Because the LLM generates content:
- validate generated exercises before use
- prevent unsupported claims in explanations
- keep examples within learner scope
- reject malformed outputs
- do not let the model drift too far beyond stored material unless the product explicitly allows that

## First Implementation Recommendation
For the first version, keep the system intentionally narrow.

Recommended initial support:
- character items
- word items
- sentence items
- grammar concept items
- deterministic checking for pinyin, writing, and many recognition cases
- LLM generation for sentence understanding and gap-fill variation
- LLM feedback for explanations and open-text corrections

This will deliver meaningful value without excessive early complexity.

## Summary
The exercise system should be built on structured learning items, not raw prompts alone.

The five initial exercise types are:
1. character recognition and translation
2. pinyin recognition
3. character writing
4. understanding of sentences
5. filling the gaps

Users should be able to add words, characters, sentences, and concepts in a standardized way. Those structured items should become the foundation for:
- exercise generation
- correction
- revision
- explanation
- learner progress tracking

The LLM should enrich the experience, not replace the system’s core structure.
