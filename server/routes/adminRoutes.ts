import express from "express";
import { createDeliveryPartner, getAdminStats, getDeliveryPartners, updateDeliveryPartner, assignDeliveryPartner } from "../controllers/adminController.js";
import auth from "../middleware/auth.js";
import admin from "../middleware/admin.js";

const adminRouter = express.Router();

adminRouter.get('/stats', auth, admin, getAdminStats)
adminRouter.get('/delivery-partners', auth, admin, getDeliveryPartners)
adminRouter.post('/delivery-partners', auth, admin, createDeliveryPartner)
adminRouter.put('/delivery-partner/:id', auth, admin, updateDeliveryPartner)
adminRouter.put('/orders/:id/assign', auth, admin, assignDeliveryPartner)

export default adminRouter