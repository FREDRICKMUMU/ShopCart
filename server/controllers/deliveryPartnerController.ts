import express from 'express';
import bcrypt from 'bcrypt';
import { prisma } from '../config/prisma.js';
import { Request } from 'express';
import jwt from 'jsonwebtoken';

interface AuthRequest extends Request {
    partner?: {
        id: string;
    }
}

const generateToken = (id: string) => {
    return jwt.sign({ id, role: "delivery" }, process.env.JWT_SECRET as string, { expiresIn: "30d" });
}

// LOGIN DELIVERY PARTNER
// POST /api/delivery/login
export const loginPartner = async (req: Request, res: express.Response) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: "Please provide email and password" });
    }

    const partner = await prisma.deliveryPartner.findUnique({
        where: { email: email.toLowerCase() }
    });

    if (!partner) {
        return res.status(401).json({ message: "Invalid email or password" });
    }

    if (!partner.isActive) {
        return res.status(403).json({ message: "Your account has been deactivated." });
    }

    const isMatch = await bcrypt.compare(password, partner.password);
    if (!isMatch) {
        return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = generateToken(partner.id);
    const { password: _, ...partnerData } = partner;

    res.json({ partner: partnerData, token });
}

// GET ASSIGNED DELIVERIES
// GET /api/delivery/my-deliveries
export const getMyDeliveries = async (req: AuthRequest, res: express.Response) => {
    const { status } = req.query;

    const where: any = { deliveryPartnerId: req.partner!.id };
    if (status === "active") {
        where.status = { in: ["Assigned", "Packed", "Out for Delivery"] };
    } else if (status === "completed") {
        where.status = { in: ["Delivered", "Cancelled"] };
    }
    const orders = await prisma.order.findMany({
        where,
        orderBy: { createdAt: "desc" },
        include: { user: { select: { name: true, email: true, phone: true } } }
    });

    res.json({ orders });
}

// GET SINGLE DELIVERY DETAIL
// GET /api/delivery/my-deliveries/:id
export const getDeliveryDetail = async (req: AuthRequest, res: express.Response) => {
    const order = await prisma.order.findFirst({
        where: { id: req.params.id as string, deliveryPartnerId: req.partner!.id },
        include: { user: { select: { name: true, email: true, phone: true } } }
    });
    if (!order) {
        return res.status(404).json({ message: "Delivery not found" });
    }
    res.json({ order });
}

// COMPLETE DELIVERY WITH OTP
// PUT /api/delivery/my-deliveries/:id/complete
export const completeDelivery = async (req: AuthRequest, res: express.Response) => {
    const { otp } = req.body;
    const order = await prisma.order.findFirst({
        where: { id: req.params.id as string, deliveryPartnerId: req.partner!.id },
    });
    if (!order || order.status === "Cancelled" || order.status === "Delivered") {
        return res.status(400).json({ message: "Invalid Request" });
    }

    if (order.deliveryOtp !== otp) {
        return res.status(500).json({ message: "Invalid OTP" });
    }

    const history = order.statusHistory as any[];
    history.push({
        status: "Delivered",
        note: "Delivery completed by rider",
        timeStamp: new Date(),
    });

    const updatedOrder = await prisma.order.update({
        where: { id: order.id },
        data: {
            status: "Delivered",
            statusHistory: history,
            deliveryOtp: ""
        }
    });
    res.json({ order: updatedOrder, message: "Delivery completed successfully" });
}

// CANCEL DELIVERY
// PUT /api/delivery/my-deliveries/:id/cancel
export const cancelDelivery = async (req: AuthRequest, res: express.Response) => {
    const { reason } = req.body;
    const order = await prisma.order.findFirst({
        where: { id: req.params.id as string, deliveryPartnerId: req.partner!.id },
    });

    if (!order) {
        return res.status(404).json({ message: "Order not found" });
    }

    if (order.status === "Delivered") {
        return res.status(400).json({ message: "Cannot cancel a delivered order" });
    }

    const history = order.statusHistory as any[];
    history.push({
        status: "Cancelled",
        note: reason || "Cancelled by rider",
        timeStamp: new Date(),
    });

    const updatedOrder = await prisma.order.update({
        where: { id: order.id },
        data: { status: "Cancelled", statusHistory: history }
    });
    res.json({ order: updatedOrder, message: "Delivery Cancelled" });
}

// UPDATE ORDER STATUS
// PUT /api/delivery/my-deliveries/:id/status
export const updateDeliveryStatus = async (req: AuthRequest, res: express.Response) => {
    const { status } = req.body;
    const allowedStatuses = ["Packed", "Out for Delivery"];
    if (!allowedStatuses.includes(status)) {
        return res.status(400).json({ message: "Invalid status update" });
    }

    const order = await prisma.order.findFirst({
        where: { id: req.params.id as string, deliveryPartnerId: req.partner!.id }
    });

    if (!order) {
        return res.status(404).json({ message: "Order not found" });
    }

    const history = order.statusHistory as any[];
    history.push({ status, note: `Status updated to ${status}`, timeStamp: new Date() });

    const updatedOrder = await prisma.order.update({
        where: { id: order.id },
        data: { status, statusHistory: history }
    });

    res.json({ order: updatedOrder, message: "Status updated successfully" });
}

// UPDATE LIVE LOCATION
// PUT /api/delivery/my-deliveries/:id/location
export const updateLocation = async (req: AuthRequest, res: express.Response) => {
    const { lat, lng } = req.body;
    const order = await prisma.order.findFirst({
        where: {
            id: req.params.id as string,
            deliveryPartnerId: req.partner!.id,
            status: { in: ['Assigned', "Packed", "Out for Delivery"] }
        }
    });

    if (!order) {
        return res.status(404).json({ message: "Order not found" });
    }

    await prisma.order.update({
        where: { id: order.id },
        data: { liveLocation: { lat, lng, updatedAt: new Date() } as any }
    });
    res.json({ success: true });
}