import express from "express";
import UserController from "./users.controller.js";
import  verifyToken from "./authMiddleware.js"

const router = express.Router();

router.post("/register", UserController.signUp);

router.post("/config", verifyToken, UserController.userSettings);

router.post("/company", verifyToken, UserController.companyData);

export default router;