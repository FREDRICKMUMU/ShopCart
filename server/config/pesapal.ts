import axios from 'axios'

const PESAPAL_BASE_URL = process.env.PESAPAL_ENV === 'sandbox'
    ? 'https://cybqa.pesapal.com/pesapalv3'
    : 'https://pay.pesapal.com/v3'

export const getPesapalToken = async () => {
    const response = await axios.post(
        `${PESAPAL_BASE_URL}/api/Auth/RequestToken`,
        {
            consumer_key: process.env.PESAPAL_CONSUMER_KEY,
            consumer_secret: process.env.PESAPAL_CONSUMER_SECRET
        },
        {
            headers: { 'Content-Type': 'application/json', Accept: 'application/json' }
        }
    )
    return response.data.token
}

export { PESAPAL_BASE_URL }