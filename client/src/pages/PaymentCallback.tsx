import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../config/api'
import toast from 'react-hot-toast'
import { useCart } from '../context/CartContext'

const PaymentCallback = () => {
    const navigate = useNavigate()
    const { clearCart } = useCart()

    useEffect(() => {
        const verify = async () => {
            const params = new URLSearchParams(window.location.search)
            const orderTrackingId =
                params.get('OrderTrackingId') ?? localStorage.getItem('pesapal_tracking')
            const merchantRef = params.get('OrderMerchantReference')
            const orderId =
                localStorage.getItem('pesapal_order')
                || (merchantRef?.startsWith('order_') ? merchantRef.split('_')[1] : merchantRef)

            if (!orderTrackingId || !orderId) {
                toast.error('Payment information not found')
                navigate('/')
                return
            }

            try {
                const { data } = await api.post('/payment/verify', { orderTrackingId, orderId })

                if (data.success) {
                    localStorage.removeItem('pesapal_tracking')
                    localStorage.removeItem('pesapal_order')
                    clearCart()
                    toast.success('Payment successful!')
                    navigate(`/orders/${orderId}`)
                } else {
                    toast.error(`Payment ${data.status || 'failed'}`)
                    navigate('/checkout')
                }
            } catch (error: any) {
                toast.error(error.response?.data?.message || error.message)
                navigate('/checkout')
            }
        }

        verify()
    }, [navigate, clearCart])

    return (
        <div className="min-h-screen flex items-center justify-center bg-app-cream">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-app-green mx-auto mb-4"></div>
                <p className="text-app-text-light">Verifying your payment...</p>
            </div>
        </div>
    )
}

export default PaymentCallback
