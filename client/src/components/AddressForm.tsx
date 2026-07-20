import { XIcon, NavigationIcon, LoaderIcon } from "lucide-react"
import { useState } from "react"
import toast from "react-hot-toast"

const AddressForm = ({ resetForm, handleSubmit, form, setForm, editingId }: any) => {
  const [locating, setLocating] = useState(false)

  const captureLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported in this browser")
      return
    }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setForm({
          ...form,
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        })
        toast.success("Location captured")
        setLocating(false)
      },
      (error) => {
        // Local/dev fallback near Nairobi CBD so maps still work without GPS permission
        setForm({
          ...form,
          lat: -1.286389,
          lng: 36.817223,
        })
        toast.error(
          error.code === 1
            ? "Location permission denied — using a local default pin. You can still save the address."
            : "Could not get GPS — using a local default pin."
        )
        setLocating(false)
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    )
  }

  return (
    <>
      {/* OVERLAY */}
      <div
        className="fixed inset-0 bg-black/40 z-50"
        onClick={resetForm}
      />

      {/* FORM CONTAINER */}
      <div className="fixed inset-0 z-50 flex-center p-4">
        <form onClick={e => e.stopPropagation()} onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 w-full max-w-lg animate-fade-in">
          {/* FORM HEADER */}
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold text-app-green">{editingId ? "Edit Address" : "Add New Address"}</h2>
            <button type="button" onClick={resetForm} className="p-2 hover:bg-app-cream rounded-lg">
              <XIcon className="size-5" />
            </button>
          </div>

          {/* FORM INPUT FIELDS */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-app-green mb-1.5">Label</label>
              <input
                type="text"
                placeholder="Home, Work, etc."
                required
                className="w-full px-4 py-2.5 text-sm rounded-xl border border-app-border focus:border-app-green outline-none"
                value={form.label}
                onChange={(e) => setForm({ ...form, label: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-app-green mb-1.5">Street Address / Landmark</label>
              <input
                type="text"
                required
                placeholder="Building, street, estate, landmark..."
                className="w-full px-4 py-2.5 text-sm rounded-xl border border-app-border focus:border-app-green outline-none"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-app-green mb-1.5">GPS Location</label>
              <button
                type="button"
                onClick={captureLocation}
                disabled={locating}
                className="w-full px-4 py-2.5 text-sm rounded-xl border border-app-border hover:border-app-green hover:bg-app-cream transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {locating ? (
                  <LoaderIcon className="size-4 animate-spin" />
                ) : (
                  <NavigationIcon className="size-4 text-app-green" />
                )}
                {form.lat && form.lng
                  ? `Pinned (${Number(form.lat).toFixed(4)}, ${Number(form.lng).toFixed(4)}) — tap to refresh`
                  : locating
                    ? "Getting location..."
                    : "Use my current location"}
              </button>
              <p className="text-xs text-app-text-light mt-1.5">
                Needed for live delivery tracking. Allow location when prompted.
              </p>
            </div>

            <div className="flex items-center pb-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isDefault}
                  onChange={(e) => setForm({ ...form, isDefault: e.target.checked })}
                />
                <span className="text-sm text-app-text">Set as default</span>
              </label>
            </div>
          </div>

          {/* SUBMIT BUTTON */}
          <button className="mt-6 w-full py-3 bg-app-green text-white font-semibold rounded-xl hover:bg-app-green-light transition-colors" type="submit">
            {editingId ? "Update Address" : "Save Address"}
          </button>
        </form>
      </div>
    </>
  )
}

export default AddressForm
