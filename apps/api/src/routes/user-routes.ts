import { Router } from "express";

import { getNextWordExercise, submitWordExercise } from "../controllers/exercise-controller.js";
import { getUser, updateUserPreferences } from "../controllers/user-controller.js";
import {
  createWord,
  listWords,
  normalizeWord,
  suggestWord,
  updateWord,
} from "../controllers/word-controller.js";

export const userRoutes = Router();

userRoutes.get("/:userId", getUser);
userRoutes.put("/:userId/preferences", updateUserPreferences);
userRoutes.get("/:userId/words", listWords);
userRoutes.post("/:userId/words/normalize", normalizeWord);
userRoutes.post("/:userId/words/suggest", suggestWord);
userRoutes.post("/:userId/words", createWord);
userRoutes.put("/:userId/words/:wordId", updateWord);
userRoutes.get("/:userId/exercises/next", getNextWordExercise);
userRoutes.post("/:userId/exercises/check", submitWordExercise);
