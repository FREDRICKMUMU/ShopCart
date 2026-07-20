import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"
import { ArrowLeft, ChevronRightIcon } from "lucide-react";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { CheckIcon, MapPinIcon } from "lucide-react";
import CheckoutAddress from "../components/Checkout/CheckoutAddress";
import CheckoutReview from "../components/Checkout/CheckoutReview";
import toast from "react-hot-toast";
import api from "../config/api";
import PesapalPayment from '../components/PesapalPayment'

const Checkout = () => {
  const navigate = useNavigate()
  const currency = import.meta.env.VITE_CURRENCY_SYMBOL || 'KSH';

  const { items, cartTotal, clearCart } = useCart()
  const { user } = useAuth()

  const [step, setStep] = useState("address")
  const [orderId, setOrderId] = useState<string | null>(null)
  const [placing, setPlacing] = useState(false)
  const [placedItems, setPlacedItems] = useState<typeof items>([])
  const [placedSubtotal, setPlacedSubtotal] = useState(0)

  const [address, setAddress] = useState({
    id: "",
    label: "Home",
    address: "",
    city: "",
    state: "",
    zip: "",
    isDefault: false,
    lat: 0,
    lng: 0,
  })

  const displayItems = orderId ? placedItems : items
  const displaySubtotal = orderId ? placedSubtotal : cartTotal
  const deliveryFee = displaySubtotal > 20 ? 0 : 1.99
  const tax = displaySubtotal * 0.08
  const total = displaySubtotal + deliveryFee + tax

  const steps: { key: string; label: string; icon: any }[] = [
    { key: "address", label: "Address", icon: MapPinIcon },
    { key: "review", label: "Review", icon: CheckIcon },
  ]

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('cancel') === 'true') {
      toast.error('Payment was cancelled');
    }
  }, []);

  const handlePlaceOrder = async () => {
    setPlacing(true)
    try {
      const orderData = {
        items: items.map((item) => ({
          product: item.product.id,
          quantity: item.quantity,
        })),
        shippingAddress: {
          ...address,
          city: address.city || "Local",
          state: address.state || "Local",
          zip: address.zip || "00000",
        },
        paymentMethod: "pesapal",
      }
      const snapshotItems = [...items]
      const snapshotSubtotal = cartTotal
      const { data } = await api.post('/orders', orderData)
      setPlacedItems(snapshotItems)
      setPlacedSubtotal(snapshotSubtotal)
      setOrderId(data.order.id)
      clearCart()
      toast.success('Order created — complete payment to confirm')
    } catch (error: any) {
      toast.error(error.response?.data?.message || error.message);
    } finally {
      setPlacing(false)
    }
  }

  useEffect(() => {
    if (user?.addresses?.length) {
      const defaultAddr = user.addresses.find((a: any) => a.isDefault) || user.addresses[0]
      setAddress({
        id: defaultAddr?.id || "",
        label: defaultAddr?.label || "Home",
        address: defaultAddr?.address || "",
        city: defaultAddr?.city || "",
        state: defaultAddr?.state || "",
        zip: defaultAddr?.zip || "",
        isDefault: defaultAddr?.isDefault || false,
        lat: defaultAddr?.lat || 0,
        lng: defaultAddr?.lng || 0,
      })
    }
  }, [user])

  if (items.length === 0 && !orderId) {
    return (
      <div className="min-h-screen bg-app-cream flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-app-green mb-2">Your cart is empty</h2>
          <p className="text-sm text-app-text-light mb-4">Add some products to checkout</p>
          <button
            onClick={() => navigate("/products")}
            className="px-5 py-2.5 bg-app-green text-white text-sm font-medium rounded-xl hover:bg-app-green-light transition-colors">
            Browse Products
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-app-cream">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-app-text-light hover:text-app-green mb-6 transition-colors">
          <ArrowLeft className="size-4" /> Back
        </button>

        <h1 className="text-2xl font-semibold text-app-green mb-8">Checkout</h1>

        <div className="flex items-center gap-2 mb-8">
          {steps.map((s, i) => (
            <div key={s.key} className="flex items-center gap-2">
              <button
                onClick={() => !orderId && setStep(s.key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${step === s.key ? "bg-app-green text-white" : "bg-white text-app-text-light"}`}>
                <s.icon className="size-4" /> {s.label}
              </button>
              {i < steps.length - 1 && <ChevronRightIcon className="size-4 text-app-text-light" />}
            </div>
          ))}
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            {step === "address" && (
              <CheckoutAddress
                address={address}
                setAddress={setAddress}
                setStep={setStep}
                user={user}
              />
            )}

            {step === "review" && (
              <div>
                <CheckoutReview
                  address={address}
                  items={displayItems}
                  total={total}
                  handlePlaceOrder={handlePlaceOrder}
                  loading={placing}
                  orderPlaced={!!orderId}
                />
                <div className="mt-6">
                  {orderId ? (
                    <PesapalPayment
                      amount={total}
                      orderId={orderId}
                    />
                  ) : null}
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl p-5 h-fit sticky top-24">
            <h3 className="text-sm font-semibold text-app-green mb-4">Order Summary</h3>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Subtotal ({displayItems.length} items)</span>
                <span>{currency}{displaySubtotal.toFixed(2)}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-app-text-light">Delivery</span>
                <span>
                  {deliveryFee === 0 ? (
                    <span className="text-app-success">Free</span>
                  ) : (
                    `${currency}${deliveryFee.toFixed(2)}`
                  )}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-app-text-light">Tax</span>
                <span>{currency}{tax.toFixed(2)}</span>
              </div>

              <div className="flex justify-between pt-3 border-t border-app-border text-base font-semibold">
                <span>Total</span>
                <span className="text-app-green">{currency}{total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Checkout
