import { Router } from "express";

import { demoLogin } from "../controllers/auth-controller.js";

export const authRoutes = Router();

authRoutes.post("/demo-login", demoLogin);
