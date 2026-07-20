import { Request, Response } from "express";
import { prisma } from "../config/prisma.js";
import { inngest } from "../inngest/index.js";

// ADD THIS CUSTOM TYPE
interface AuthRequest extends Request {
    user?: {
        id: string;
        isAdmin?: boolean;
    }
}

// CREATE ORDER
// POST /api/orders
export const createOrder = async (req: AuthRequest, res: Response) => {
    try {
        const { items, shippingAddress, paymentMethod } = req.body;

        if (!items || items.length === 0) {
            return res.status(400).json({ message: "No order items" });
        }

        const productIds = items.map((i: any) => i.product);
        const products = await prisma.product.findMany({ where: { id: { in: productIds } } });

        const productMap: Record<string, (typeof products)[0]> = {};
        products.forEach((p: any) => (productMap[p.id] = p));

        for (const item of items) {
            const product = productMap[item.product];
            if (!product || (product.stock ?? 0) < item.quantity) {
                return res.status(404).json({ message: "Product out of stock" });
            }
        }

        const orderItems = items.map((item: any) => {
            const dbProduct = productMap[item.product];
            if (!dbProduct) throw new Error(`product ${item.product} notfound`);
            return {
                product: dbProduct.id,
                name: dbProduct.name,
                price: dbProduct.price,
                quantity: item.quantity,
                image: dbProduct.image,
                unit: dbProduct.unit,
            };
        });

        const subtotal = orderItems.reduce((sum: number, item: any) => sum + item.price * item.quantity, 0);
        const deliveryFee = subtotal > 20 ? 0 : 1.99;
        const tax = Math.round(subtotal * 0.08 * 100) / 100;
        const total = Math.round((subtotal + deliveryFee + tax) * 100) / 100;

        const order = await prisma.order.create({
            data: {
                userId: req.user!.id,
                items: orderItems as any,
                shippingAddress,
                paymentMethod,
                subtotal,
                deliveryFee,
                tax,
                total,
                statusHistory: [{ status: "Placed", note: "Order placed successfully", timestamps: new Date() }] as any
            }
        });

      

        for (const item of orderItems) {
            await prisma.product.update({
                where: { id: item.product },
                data: { stock: { decrement: item.quantity } }
            });
        }

        // Background jobs should not fail the order response
        try {
            for (const item of orderItems) {
                await inngest.send({ name: "inventory/stock.updated", data: { productId: item.product } });
            }
            await inngest.send({ name: "order/placed", data: { orderId: order.id } });
        } catch (err) {
            console.error("Inngest notify failed after order create:", err);
        }

        res.json({ order });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
}

// GET USER'S ORDERS
// GET /api/orders
export const getUserOrders = async (req: AuthRequest, res: Response) => {
    try {
        const { status } = req.query;

        const where: any = {
            userId: req.user!.id,
        };

        // Only hide abandoned online checkouts older than nothing — show pending payments so My Orders updates immediately
        // Unpaid online orders are still listed with their Placed status until payment confirms

        if (status && status !== "all") {
            // Accept friendly tab labels from the client
            const statusMap: Record<string, string> = {
                placed: "Placed",
                "out of delivery": "Out for Delivery",
                "out for delivery": "Out for Delivery",
                delivered: "Delivered",
                cancelled: "Cancelled",
            };
            const key = String(status).toLowerCase();
            where.status = statusMap[key] || status;
        }

        const orders = await prisma.order.findMany({
            where,
            include: { deliveryPartner: { select: { name: true, phone: true } } },
            orderBy: { createdAt: "desc" },
        });
        res.json({ orders });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
}

// GET SINGLE ORDER
// GET /api/orders/:id
export const getOrder = async (req: AuthRequest, res: Response) => {
    try {
        const order = await prisma.order.findFirst({
            where: { id: req.params.id as string, userId: req.user!.id },
            include: {
                deliveryPartner: {
                    select: {
                        name: true,
                        phone: true,
                        avatar: true,
                        vehicleType: true
                    }
                }
            }
        });
        if (!order) {
            return res.status(404).json({ message: "Orders not found" });
        }
        res.json({ order });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
}

// UPDATE ORDER STATUS (admin)
// PUT /api/orders/:id/status
export const updateOrderStatus = async (req: Request, res: Response) => {
    try {
        const { status, note } = req.body;
        const order = await prisma.order.findUnique({ where: { id: req.params.id as string } });

        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }
        const history = (Array.isArray(order.statusHistory) ? order.statusHistory : []) as any[];
        history.push({
            status,
            note: note || `order ${status.toLowerCase()}`,
            timeStamp: new Date()
        });
        const updatedOrder = await prisma.order.update({
            where: { id: req.params.id as string },
            data: { status, statusHistory: history as any }
        });

        res.json({ order: updatedOrder });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
}

// GET ALL ORDERS (admin)
// GET /api/orders/all
export const getAllOrders = async (req: Request, res: Response) => {
    try {
        const orders = await prisma.order.findMany({
            include: {
                user: { select: { name: true, email: true } },
                deliveryPartner: { select: { name: true, phone: true, email: true } }
            },
            orderBy: { createdAt: "desc" },
        });
        res.json({ orders });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
}

// GET ORDER LOCATION (customer own order, or admin any order)
// GET /api/orders/:id/location
export const getOrderLocation = async (req: AuthRequest, res: Response) => {
    try {
        const order = await prisma.order.findUnique({
            where: { id: req.params.id as string },
            select: {
                userId: true,
                liveLocation: true,
                status: true,
                shippingAddress: true,
            }
        });

        if (!order) return res.status(404).json({ message: "Order not found" });

        if (order.userId !== req.user!.id) {
            const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
            const adminEmails = process.env.ADMIN_EMAILS
                ? process.env.ADMIN_EMAILS.split(",").map((e) => e.trim().toLowerCase())
                : [];
            const isAdmin = !!user && adminEmails.includes(user.email.toLowerCase());
            if (!isAdmin) {
                return res.status(403).json({ message: "Not authorized" });
            }
        }

        res.json({
            liveLocation: order.liveLocation,
            status: order.status,
            shippingAddress: order.shippingAddress,
        });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
}