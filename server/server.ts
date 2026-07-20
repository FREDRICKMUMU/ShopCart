import "dotenv/config";
import express, { NextFunction, Request, Response } from 'express';
import cors from "cors";
import authRouter from './routes/authRoutes.js'
import productRouter from './routes/productRoutes.js'
import orderRouter from './routes/orderRoutes.js'
import uploadRouter from "./routes/uploadRoutes.js";
import { serve } from "inngest/express";
import { inngest, functions } from "./inngest/index.js";
import addressRouter from "./routes/addressRoutes.js";
import adminRouter from "./routes/adminRoutes.js";
import deliveryPartnerRouter from "./routes/deliveryPartnerRoutes.js";
import paymentRouter from './routes/paymentRoutes.js'
import newsletterRouter from './routes/newsletterRoutes.js'


const app = express();

// Middleware
app.use(cors())
app.use(express.json());

const port = process.env.PORT || 5000;

app.get('/', (req: Request, res: Response) => {
    res.send('Server is Live!');
});

app.use('/api/auth', authRouter)
app.use('/api/products', productRouter)
app.use('/api/upload', uploadRouter)
app.use('/api/orders', orderRouter)
app.use("/api/inngest", serve({ client: inngest, functions }));
app.use('/api/addresses', addressRouter)
app.use('/api/admin', adminRouter)
app.use('/api/delivery', deliveryPartnerRouter)
app.use('/api/payment', paymentRouter)
app.use('/api/newsletter', newsletterRouter)


// ERROR HANDLING
app.use((error: any, req: Request, res: Response, next: NextFunction) => {
    console.error(error)
    res.status(500).json({ message: error.message })
})

if (process.env.NODE_ENV !== 'production') {
    app.listen(port, () => {
        console.log(`Server is running at http://localhost:${port}`);
    });
}

export default app;