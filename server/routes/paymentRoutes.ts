import express from 'express'
import {
    initializePayment,
    verifyPayment,
    handleWebhook,
    registerIPN
} from '../controllers/paymentController.js'
import auth from '../middleware/auth.js'

const paymentRouter = express.Router()

paymentRouter.post('/initialize', auth, initializePayment)
paymentRouter.post('/verify', auth, verifyPayment)
paymentRouter.get('/webhook', handleWebhook)
paymentRouter.post('/register-ipn', registerIPN)

export default paymentRouter