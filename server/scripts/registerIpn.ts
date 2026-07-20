import 'dotenv/config'
import axios from 'axios'

const PESAPAL_BASE_URL = process.env.PESAPAL_ENV === 'sandbox'
    ? 'https://cybqa.pesapal.com/pesapalv3'
    : 'https://pay.pesapal.com/v3'

const register = async () => {
    try {
        const tokenRes = await axios.post(
            `${PESAPAL_BASE_URL}/api/Auth/RequestToken`,
            {
                consumer_key: process.env.PESAPAL_CONSUMER_KEY,
                consumer_secret: process.env.PESAPAL_CONSUMER_SECRET
            },
            { headers: { 'Content-Type': 'application/json', Accept: 'application/json' } }
        )

        const ipnRes = await axios.post(
            `${PESAPAL_BASE_URL}/api/URLSetup/RegisterIPN`,
            {
                url: `${process.env.SERVER_URL}/api/payment/webhook`,
                ipn_notification_type: 'GET'
            },
            {
                headers: {
                    Authorization: `Bearer ${tokenRes.data.token}`,
                    'Content-Type': 'application/json',
                    Accept: 'application/json'
                }
            }
        )

        console.log('IPN ID:', ipnRes.data.ipn_id)
        console.log('Add this to your .env as PESAPAL_IPN_ID')
    } catch (error: any) {
        console.error(error.response?.data || error.message)
    }
}

register()