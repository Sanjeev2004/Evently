import { Router } from "express";
import { authController as c } from "../controllers/auth.controller.js";
import { authenticate } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { asyncHandler } from "../utils/http.js";
import { loginSchema, registerSchema } from "../validators/schemas.js";
export const authRouter = Router();
authRouter.post(
  "/register",
  validate(registerSchema),
  asyncHandler(c.register),
);
authRouter.post("/login", validate(loginSchema), asyncHandler(c.login));
authRouter.post("/refresh", asyncHandler(c.refresh));
authRouter.post("/logout", asyncHandler(c.logout));
authRouter.get("/me", authenticate, asyncHandler(c.me));
