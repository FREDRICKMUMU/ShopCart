import { ChevronRightIcon, BanknoteIcon } from "lucide-react";
import type { Dispatch, SetStateAction, ReactNode } from "react";

interface CheckoutPaymentProps {
    setStep: Dispatch<SetStateAction<string>>;
    paymentMethod: string;
    setPaymentMethod: Dispatch<SetStateAction<string>>;
}

const MpesaIcon = () => (
    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="white" aria-hidden="true">
        <path d="M6 4h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zm1 4v8h2.2l3.1-4.2 2.7 4.2H18V8h-2.2l-3.2 4.3L9.8 8H7z" />
    </svg>
);

const AirtelIcon = () => (
    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="white" aria-hidden="true">
        <path d="M12 3c4.97 0 9 4.03 9 9s-4.03 9-9 9-9-4.03-9-9 4.03-9 9-9zm-1.2 4.8v4.2H7.5v2.4h3.3V19h2.4v-4.6h3.3v-2.4h-3.3V7.8h-2.4z" />
    </svg>
);

type PaymentMethod = {
    value: string;
    label: string;
    desc: string;
    iconBg: string;
    selected: string;
    unselected: string;
    icon: ReactNode;
};

const paymentMethods: PaymentMethod[] = [
    {
        value: "mpesa",
        label: "M-Pesa",
        desc: "Pay via Safaricom M-Pesa STK push",
        iconBg: "bg-green-600",
        selected: "border-green-500 bg-green-50 ring-2 ring-green-400",
        unselected: "border-gray-200 hover:border-green-300",
        icon: <MpesaIcon />,
    },
    {
        value: "airtel",
        label: "Airtel Money",
        desc: "Pay via Airtel mobile money",
        iconBg: "bg-red-600",
        selected: "border-red-500 bg-red-50 ring-2 ring-red-400",
        unselected: "border-gray-200 hover:border-red-300",
        icon: <AirtelIcon />,
    },
    {
        value: "card",
        label: "Credit / Debit Card",
        desc: "Visa, Mastercard & more",
        iconBg: "bg-indigo-600",
        selected: "border-indigo-500 bg-indigo-50 ring-2 ring-indigo-400",
        unselected: "border-gray-200 hover:border-indigo-300",
        icon: <span className="text-xl leading-none">💳</span>,
    },
    {
        value: "cash",
        label: "Cash on Delivery",
        desc: "Pay when your groceries arrive",
        iconBg: "bg-amber-600",
        selected: "border-amber-500 bg-amber-50 ring-2 ring-amber-400",
        unselected: "border-gray-200 hover:border-amber-300",
        icon: <BanknoteIcon className="w-5 h-5 text-white" />,
    },
];

export default function CheckoutPayment({ setStep, paymentMethod, setPaymentMethod }: CheckoutPaymentProps) {
    return (
        <div className="bg-white rounded-2xl p-6 animate-fade-in">
            <h2 className="text-lg font-semibold text-app-green mb-5">Payment Method</h2>
            <div className="space-y-3">
                {paymentMethods.map((method) => {
                    const isSelected = paymentMethod === method.value;
                    return (
                        <label
                            key={method.value}
                            className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                                isSelected ? method.selected : `${method.unselected} bg-white`
                            }`}
                        >
                            <input
                                type="radio"
                                name="payment"
                                value={method.value}
                                checked={isSelected}
                                onChange={(e) => setPaymentMethod(e.target.value)}
                                className="sr-only"
                            />
                            <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${method.iconBg}`}>
                                {method.icon}
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className={`text-sm font-semibold ${isSelected ? "text-gray-900" : "text-app-green"}`}>
                                    {method.label}
                                </p>
                                <p className="text-xs text-app-text-light mt-0.5">{method.desc}</p>
                            </div>
                            <div
                                className={`h-4 w-4 rounded-full border-2 shrink-0 ${
                                    isSelected ? "border-current bg-current" : "border-gray-300"
                                }`}
                            />
                        </label>
                    );
                })}
            </div>
            <button
                onClick={() => { setStep("review"); scrollTo(0, 0) }}
                className="mt-6 px-6 py-3 bg-app-green text-white font-semibold rounded-xl hover:bg-app-green-light transition-colors flex items-center gap-2"
            >
                Review Order <ChevronRightIcon className="size-4" />
            </button>
        </div>
    );
}
