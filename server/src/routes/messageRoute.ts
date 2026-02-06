import { Router } from "express";
import { authMiddleware } from "../middlewares/auth";
import { fetch, send } from "../controllers/messageController";

const router = Router()

router.post("/", authMiddleware,send);
router.get("/:chatId", authMiddleware, fetch)

export default router;