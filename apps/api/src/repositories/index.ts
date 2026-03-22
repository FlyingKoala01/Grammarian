import type { StudyRepository } from "./study-repository.js";
import { postgresStudyRepository } from "./postgres-study-repository.js";

export const studyRepository: StudyRepository = postgresStudyRepository;
