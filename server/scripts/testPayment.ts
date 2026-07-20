import 'dotenv/config'
import axios from 'axios'
import jwt from 'jsonwebtoken'
import { prisma } from '../config/prisma.js'
import { getPesapalToken, PESAPAL_BASE_URL } from '../config/pesapal.js'

async function main() {
    const order = await prisma.order.findFirst({
        where: { isPaid: false },
        orderBy: { createdAt: 'desc' },
        include: { user: true },
    })

    if (!order) {
        console.log('No unpaid order found')
        return
    }

    console.log('Order:', {
        id: order.id,
        total: order.total,
        userId: order.userId,
        email: order.user.email,
        phone: order.user.phone,
    })

    const token = jwt.sign({ id: order.userId }, process.env.JWT_SECRET as string)

    try {
        const res = await axios.post(
            `http://localhost:${process.env.PORT || 5000}/api/payment/initialize`,
            { orderId: order.id, paymentMethod: order.paymentMethod },
            { headers: { Authorization: `Bearer ${token}` } }
        )
        console.log('API SUCCESS:', res.data)
    } catch (error: any) {
        console.log('API ERROR:', error.response?.status, error.response?.data || error.message)
    }

    try {
        const pesapalToken = await getPesapalToken()
        console.log('Pesapal token ok:', !!pesapalToken)

        const payload = {
            id: order.id,
            currency: 'KES',
            amount: Number(order.total.toFixed(2)),
            description: 'Grocery order test',
            callback_url: `${process.env.CLIENT_URL}/payment/callback`,
            cancellation_url: `${process.env.CLIENT_URL}/checkout?cancel=true`,
            notification_id: process.env.PESAPAL_IPN_ID,
            billing_address: {
                email_address: order.user.email,
                phone_number: order.user.phone || '',
                country_code: 'KE',
                first_name: order.user.name?.split(' ')[0] || 'Customer',
                last_name: order.user.name?.split(' ').slice(1).join(' ') || '',
            },
        }

        const direct = await axios.post(
            `${PESAPAL_BASE_URL}/api/Transactions/SubmitOrderRequest`,
            payload,
            {
                headers: {
                    Authorization: `Bearer ${pesapalToken}`,
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                },
            }
        )
        console.log('DIRECT PESAPAL:', direct.data)
    } catch (error: any) {
        console.log('DIRECT ERROR:', error.response?.data || error.message)
    }

    await prisma.$disconnect()
}

main()
