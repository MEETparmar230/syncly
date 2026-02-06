import { Router } from "express";
import { getUserStatus,getUser, getAllUsers } from "../controllers/userController";
import { authMiddleware } from "../middlewares/auth";

const router = Router()

router.get("/:userId/status", authMiddleware, getUserStatus);
router.get("/",authMiddleware,getAllUsers)
router.get("/:id",authMiddleware,getUser)

export default router;