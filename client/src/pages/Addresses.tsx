import type { Address } from "../types"
import { useEffect, useState } from "react"
import { dummyAddressData } from "../assets/assets"
import AddressCard from "../components/AddressCard"
import AddressForm from "../components/AddressForm"
import { PlusIcon, MapPinIcon } from "lucide-react"

const Addresses = () => {

  const [addresses, setAddresses] = useState<Address[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({ label: "", address: "", city: "", state: "", zip: "", isDefault: false })

  const resetForm = () => {
    setForm({ label: "", address: "", city: "", state: "", zip: "", isDefault: false })
    setShowForm(false)
    setEditingId(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
  }

  const onEditHandler = (addr: Address) => {
    setForm({ label: addr.label, address: addr.address, city: addr.city, state: addr.state, zip: addr.zip, isDefault: addr.isDefault })
    setEditingId(addr.id)
    setShowForm(true)
  }

  useEffect(() => {
    setAddresses(dummyAddressData)
    setTimeout(() => setLoading(false), 1000)
  }, [])

  if (loading) return <div className="flex-center py-16">Loading...</div>

  return (
    <div className="min-h-screen bg-app-cream">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* PAGE HEADER */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-semibold text-app-green">My Addresses</h1>

          <button
            onClick={() => { resetForm(); setShowForm(true) }}
            className="px-4 py-2 bg-app-green text-white text-sm font-semibold rounded-xl hover:bg-app-green-light transition-colors flex items-center gap-2">
            <PlusIcon className="size-4" /> Add Address
          </button>
        </div>

        {/* FORM MODAL */}
        {showForm && <AddressForm resetForm={resetForm} handleSubmit={handleSubmit} form={form} setForm={setForm} editingId={editingId} />}

        {/* ADDRESS LIST */}
        {addresses.length === 0 ? (
          <div className="text-center py-16">
            <MapPinIcon className="size-16 text-app-border mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-app-green mb-2">No addresses saved</h2>
            <p className="text-sm text-app-text-light">Add an address for faster checkout</p>
          </div>
        ) : (
          <div className="space-y-4">
            {addresses.map((addr) => (
              <AddressCard key={addr.id} addr={addr} onEditHandler={onEditHandler} setAddresses={setAddresses} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Addresses