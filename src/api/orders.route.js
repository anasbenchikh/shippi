import express from "express";
import OrdersController from "./orders.controller.js";
import verifyToken from "./authMiddleware.js";

const router = express.Router();

router.get("/expeditions", verifyToken, OrdersController.getExpeditions);

router.post("/create-shipment", verifyToken, OrdersController.createTicket);

router.post("/status", OrdersController.getOrderStatus);

router.post("/create-colissimo-shipment", verifyToken, OrdersController.createLabelColissimo);

router.get("/statistics", verifyToken, OrdersController.getExpeditionsStatistics);

export default router;