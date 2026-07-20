import { CheckIcon, MapPinIcon, PencilIcon, Trash2Icon } from "lucide-react";
import type { Address } from "../types";
import { useAuth } from "../context/AuthContext";
import api from "../config/api";
import toast from "react-hot-toast";

interface AddressCardProps {
  addr: Address;
  onEditHandler: (addr: Address) => void
  setAddresses?: (addresses: Address[]) => void;
}

const AddressCard = ({ addr, onEditHandler, setAddresses }: AddressCardProps) => {

  const { updateUser } = useAuth()
  
  const handleDelete = async (id: string) => {
    try {
      const confirm = window.confirm("Are you sure you want to delete this address ?");
      if (!confirm) return;
      const { data } = await api.delete(`/addresses/${id}`);
      if (setAddresses) setAddresses(data.addresses);
      updateUser({ addresses: data.addresses })
      toast.success('Address removed')
    } catch (error: any) {
      toast.error(error.response?.data?.message || error?.message);
    }
  }

  return (
    <div className="max-w-3xl bg-white rounded-2xl p-6 flex items-start justify-between">
      {/* LEFT */}
      <div className="flex gap-4">
        <div className="size-10 rounded-xl bg-app-cream flex-shrink-0 flex items-center justify-center">
          <MapPinIcon className="size-5 text-app-green" />
        </div>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <p className="text-sm font-semibold text-app-green">{addr.label}</p>
            {addr.isDefault && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[10px] font-medium bg-app-green text-white rounded-full">
                <CheckIcon className="size-2.5" />
                Default
              </span>
            )}
          </div>
          <p className="text-sm text-app-text-light">{addr.address}</p>
          {(addr.lat !== 0 || addr.lng !== 0) && (
            <p className="text-xs text-app-text-light mt-1">
              GPS: {addr.lat.toFixed(4)}, {addr.lng.toFixed(4)}
            </p>
          )}
        </div>
      </div>

      {/* RIGHT ACTION BUTTONS */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => onEditHandler(addr)}
          className="p-2 text-app-text-light hover:text-app-green hover:bg-app-cream rounded-lg transition-colors">
          <PencilIcon className="size-4" />
        </button>

        <button
          onClick={() => handleDelete(addr.id)}
          className="p-2 text-app-text-light hover:text-app-error hover:bg-red-50 rounded-lg transition-colors">
          <Trash2Icon className="size-4" />
        </button>
      </div>
    </div>
  )
}

export default AddressCard