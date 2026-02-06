import { Router } from "express";
import { authMiddleware } from "../middlewares/auth";
import { createChat, getChats } from "../controllers/chatController";


const router = Router();

router.post("/one-to-one", authMiddleware,createChat)
router.get("/", authMiddleware, getChats);


export default router;