import { Request, Response } from "express";
import { prisma } from "../config/prisma.js";

export const subscribeNewsletter = async (req: Request, res: Response) => {
    try {
        const email = String(req.body.email || "").trim().toLowerCase();

        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.status(400).json({ message: "Please provide a valid email address" });
        }

        const existing = await prisma.newsletterSubscriber.findUnique({ where: { email } });
        if (existing) {
            return res.json({ message: "You're already subscribed to our newsletter!" });
        }

        await prisma.newsletterSubscriber.create({ data: { email } });
        res.status(201).json({ message: "Thanks for subscribing! We'll keep you updated." });
    } catch (error: any) {
        res.status(500).json({ message: error.message || "Subscription failed" });
    }
};
