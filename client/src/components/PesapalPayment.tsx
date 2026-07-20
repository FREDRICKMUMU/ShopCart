import { useState } from 'react'
import api from '../config/api'
import toast from 'react-hot-toast'

interface Props {
    amount: number
    orderId: string
}

const PesapalPayment = ({ amount, orderId }: Props) => {
    const [loading, setLoading] = useState(false)

    const handlePayment = async () => {
        if (!orderId) {
            toast.error('Order not found. Please try again.')
            return
        }

        setLoading(true)
        try {
            const { data } = await api.post('/payment/initialize', { orderId, paymentMethod: 'pesapal' })

            if (!data.redirect_url) {
                toast.error(data.message || 'Payment URL not received')
                return
            }

            localStorage.setItem('pesapal_tracking', data.order_tracking_id)
            localStorage.setItem('pesapal_order', orderId)

            window.location.href = data.redirect_url
        } catch (error: any) {
            toast.error(error.response?.data?.message || error.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="space-y-3">
            <p className="text-sm text-app-text-light text-center">
                You will choose M-Pesa, card, or other methods on the secure Pesapal page.
            </p>
            <button
                onClick={handlePayment}
                disabled={loading || !orderId}
                className="w-full py-3 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 bg-app-orange hover:bg-app-orange-dark"
            >
                {loading ? 'Redirecting...' : `Pay KES ${amount.toLocaleString()} with Pesapal`}
            </button>
        </div>
    )
}

export default PesapalPayment
