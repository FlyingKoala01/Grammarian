# Product Overview

## Vision
Build a web-based Chinese learning application that helps users study, practice, and revise what they know through high-quality interactive exercises.

The platform should support both structured revision and exploratory learning. It should feel like a smart study companion rather than only a static exercise catalog.

## Core Problem
Learners often struggle with:
- retaining vocabulary and characters over time
- receiving useful correction on free-form answers
- finding enough varied practice
- understanding why an answer is wrong
- switching between memorization and active use

This project addresses these gaps through guided exercises, revision workflows, and LLM-assisted explanations and corrections.

## Target User
Primary user:
- self-directed Chinese learner using web and mobile-friendly interfaces

Possible learner profiles:
- beginner building vocabulary and character recognition
- intermediate learner reinforcing grammar and reading
- advanced learner refining expression and nuance

## Core Value Proposition
The application will:
- generate varied exercises from known material
- help users revise previously studied content
- correct open answers with contextual feedback
- answer learner questions about language points
- adapt practice to the learner’s level and history

## Main Product Capabilities
### 1. Study
Users can study selected content sets such as words, characters, sentences, or grammar topics.

### 2. Practice
Users complete different exercise types such as:
- flash recall
- multiple choice
- fill in the blank
- reorder sentence
- translate prompt
- write the pinyin
- identify the hanzi
- short free-form response

### 3. Revision
The app schedules review of previously studied content, ideally with spaced repetition or a similar revision model.

### 4. Correction
The system evaluates answers and provides:
- correct/incorrect result
- expected answer
- acceptable variants where relevant
- explanation of mistakes
- advice for improvement

### 5. Ask the Tutor
Users can ask language questions and receive answers grounded in the learning context.

## Role of the LLM
The LLM is an assistant layer, not the whole product.

It is used to:
- diversify exercise phrasing
- generate additional examples
- correct open-ended answers
- explain answers and mistakes
- answer learner questions

It should not replace deterministic logic where deterministic logic is better suited, such as:
- scoring exact vocabulary matches
- validating simple multiple-choice
- scheduling revision
- tracking progress state

## Key Product Principles
- learning first
- clarity over novelty
- variety without randomness
- explanations that teach, not just judge
- measurable progress
- fast interaction loops

## Non-Goals for Early Versions
- building a social network
- gamification-heavy mechanics
- support for every language-learning methodology
- offline-first complexity from day one
- broad marketplace features

## Early Success Indicators
- users complete study sessions regularly
- revision sessions bring back previously studied content
- correction feedback is perceived as useful
- exercise variety reduces repetition fatigue
- ask-the-tutor usage leads to longer engagement
