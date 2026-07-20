import { Request, Response } from 'express'
import axios from 'axios'
import { getPesapalToken, PESAPAL_BASE_URL } from '../config/pesapal.js'
import { prisma } from '../config/prisma.js'

interface AuthRequest extends Request {
    user?: { id: string }
}

const formatKenyaPhone = (phone = '') => {
    const digits = String(phone).replace(/\D/g, '')
    if (!digits) return ''
    if (digits.startsWith('254')) return digits
    if (digits.startsWith('0')) return `254${digits.slice(1)}`
    if (digits.length === 9) return `254${digits}`
    return digits
}

const paymentMethodLabel = (method?: string) => {
    switch (method) {
        case 'mpesa': return 'M-Pesa'
        case 'airtel': return 'Airtel Money'
        case 'card': return 'Card'
        case 'pesapal': return 'Pesapal'
        default: return 'Online'
    }
}

export const registerIPN = async (req: Request, res: Response) => {
    try {
        const token = await getPesapalToken()

        const response = await axios.post(
            `${PESAPAL_BASE_URL}/api/URLSetup/RegisterIPN`,
            {
                url: `${process.env.SERVER_URL}/api/payment/webhook`,
                ipn_notification_type: 'GET'
            },
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    Accept: 'application/json'
                }
            }
        )

        res.json({ ipn_id: response.data.ipn_id })
    } catch (error: any) {
        res.status(500).json({ message: error.message })
    }
}

export const initializePayment = async (req: AuthRequest, res: Response) => {
    try {
        const { orderId, paymentMethod } = req.body
        const userId = req.user!.id

        if (!orderId) {
            return res.status(400).json({ message: 'Order ID is required' })
        }

        if (!process.env.CLIENT_URL) {
            return res.status(500).json({ message: 'CLIENT_URL is not configured on the server' })
        }

        if (!process.env.PESAPAL_IPN_ID) {
            return res.status(500).json({ message: 'PESAPAL_IPN_ID is not configured. Run the IPN registration script first.' })
        }

        if (!process.env.PESAPAL_CONSUMER_KEY || !process.env.PESAPAL_CONSUMER_SECRET) {
            return res.status(500).json({ message: 'Pesapal credentials are not configured on the server' })
        }

        const [order, user] = await Promise.all([
            prisma.order.findFirst({ where: { id: orderId, userId } }),
            prisma.user.findUnique({ where: { id: userId } })
        ])

        if (!order) {
            return res.status(404).json({ message: 'Order not found' })
        }

        if (order.isPaid) {
            return res.status(400).json({ message: 'Order is already paid' })
        }

        if (!order.total || order.total < 1) {
            return res.status(400).json({ message: 'Order total must be at least KES 1' })
        }

        if (!user?.email && !user?.phone) {
            return res.status(400).json({ message: 'Add an email or phone number to your profile before paying' })
        }

        const shippingAddress = order.shippingAddress as Record<string, string> | null
        const phoneNumber = formatKenyaPhone(user.phone || shippingAddress?.phone || '')
        const token = await getPesapalToken()
        const method = paymentMethod || order.paymentMethod || 'card'

        const payload = {
            id: orderId,
            currency: 'KES',
            amount: Number(order.total.toFixed(2)),
            description: `Grocery order via ${paymentMethodLabel(method)}`.slice(0, 100),
            callback_url: `${process.env.CLIENT_URL}/payment/callback`,
            cancellation_url: `${process.env.CLIENT_URL}/checkout?cancel=true`,
            notification_id: process.env.PESAPAL_IPN_ID,
            billing_address: {
                email_address: user.email,
                phone_number: phoneNumber || user.phone || '',
                country_code: 'KE',
                first_name: user.name?.split(' ')[0] || 'Customer',
                last_name: user.name?.split(' ').slice(1).join(' ') || '',
                line_1: shippingAddress?.address || '',
                city: shippingAddress?.city || '',
                state: shippingAddress?.state?.slice(0, 3) || '',
                postal_code: shippingAddress?.zip || '',
            }
        }

        const response = await axios.post(
            `${PESAPAL_BASE_URL}/api/Transactions/SubmitOrderRequest`,
            payload,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    Accept: 'application/json'
                }
            }
        )

        if (!response.data.redirect_url) {
            return res.status(500).json({
                message: response.data.error?.message || response.data.message || 'Payment URL not received from Pesapal'
            })
        }

        res.json({
            redirect_url: response.data.redirect_url,
            order_tracking_id: response.data.order_tracking_id
        })
    } catch (error: any) {
        const message = error.response?.data?.error?.message
            || error.response?.data?.message
            || error.message
        console.error('Pesapal initialize error:', error.response?.data || message)
        res.status(500).json({ message })
    }
}

export const verifyPayment = async (req: AuthRequest, res: Response) => {
    try {
        const { orderTrackingId, orderId } = req.body
        const userId = req.user!.id

        if (!orderTrackingId || !orderId) {
            return res.status(400).json({ message: 'orderTrackingId and orderId are required' })
        }

        const order = await prisma.order.findFirst({ where: { id: orderId, userId } })
        if (!order) {
            return res.status(404).json({ message: 'Order not found' })
        }

        const token = await getPesapalToken()

        const response = await axios.get(
            `${PESAPAL_BASE_URL}/api/Transactions/GetTransactionStatus?orderTrackingId=${orderTrackingId}`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: 'application/json'
                }
            }
        )

        const status = response.data.payment_status_description

        if (status === 'Completed') {
            await prisma.order.update({
                where: { id: orderId },
                data: { isPaid: true, status: 'Confirmed' }
            })
            res.json({ success: true, status })
        } else {
            res.json({ success: false, status })
        }
    } catch (error: any) {
        const message = error.response?.data?.error?.message || error.message
        res.status(500).json({ message })
    }
}

const resolveOrderIdFromReference = (merchantReference?: string | null) => {
    if (!merchantReference) return null
    if (merchantReference.startsWith('order_')) {
        return merchantReference.split('_')[1] || null
    }
    return merchantReference
}

export const handleWebhook = async (req: Request, res: Response) => {
    try {
        const { OrderTrackingId, OrderMerchantReference } = req.query
        const token = await getPesapalToken()

        const response = await axios.get(
            `${PESAPAL_BASE_URL}/api/Transactions/GetTransactionStatus?orderTrackingId=${OrderTrackingId}`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: 'application/json'
                }
            }
        )

        if (response.data.payment_status_description === 'Completed') {
            const orderId = resolveOrderIdFromReference(String(OrderMerchantReference || ''))
            if (orderId) {
                await prisma.order.update({
                    where: { id: orderId },
                    data: { isPaid: true, status: 'Confirmed' }
                })
            }
        }

        res.status(200).json({
            orderNotificationType: 'IPNCHANGE',
            orderTrackingId: OrderTrackingId,
            orderMerchantReference: OrderMerchantReference,
            status: 200
        })
    } catch (error: any) {
        res.status(500).json({ message: error.message })
    }
}
