import { Router } from "express";
import { login, logout, me, register } from "../controllers/authController";
import { authMiddleware } from "../middlewares/auth";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me",authMiddleware, me)
router.get('/logout',logout)

export default router;
