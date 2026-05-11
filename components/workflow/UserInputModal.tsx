"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UserInputRequest } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { AlertTriangle, Lock, MapPin, CreditCard, ShoppingCart, Shield } from "lucide-react";

interface UserInputModalProps {
  request: UserInputRequest | null;
  onSubmit: (data: Record<string, string>) => void;
  onDismiss: () => void;
}

const TYPE_CONFIG = {
  amazon_login: {
    icon: <Lock className="h-5 w-5" />,
    color: "text-amber-600",
    bg: "bg-amber-50 border-amber-200",
    title: "Amazon Login Required",
  },
  captcha: {
    icon: <Shield className="h-5 w-5" />,
    color: "text-blue-600",
    bg: "bg-blue-50 border-blue-200",
    title: "CAPTCHA Verification",
  },
  "2fa": {
    icon: <Shield className="h-5 w-5" />,
    color: "text-purple-600",
    bg: "bg-purple-50 border-purple-200",
    title: "Two-Factor Authentication",
  },
  confirm_purchase: {
    icon: <ShoppingCart className="h-5 w-5" />,
    color: "text-emerald-600",
    bg: "bg-emerald-50 border-emerald-200",
    title: "Confirm Purchase",
  },
  address: {
    icon: <MapPin className="h-5 w-5" />,
    color: "text-blue-600",
    bg: "bg-blue-50 border-blue-200",
    title: "Shipping Address Required",
  },
  payment: {
    icon: <CreditCard className="h-5 w-5" />,
    color: "text-indigo-600",
    bg: "bg-indigo-50 border-indigo-200",
    title: "Payment Information Required",
  },
};

export function UserInputModal({ request, onSubmit, onDismiss }: UserInputModalProps) {
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const config = request ? TYPE_CONFIG[request.type] : null;

  const handleSubmit = () => {
    if (!request) return;
    const newErrors: Record<string, string> = {};
    request.fields?.forEach((field) => {
      if (field.required && !formData[field.name]?.trim()) {
        newErrors[field.name] = `${field.label} is required`;
      }
    });
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    onSubmit(formData);
    setFormData({});
    setErrors({});
  };

  return (
    <AnimatePresence>
      {request && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={onDismiss}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-black/10"
          >
            {/* Header */}
            <div className={cn("flex items-center gap-3 rounded-t-2xl border-b border-slate-100 p-5", config?.bg)}>
              <div className={config?.color}>{config?.icon}</div>
              <div>
                <h2 className="font-semibold text-slate-800">{config?.title}</h2>
                <p className="text-xs text-slate-500 mt-0.5">{request.message}</p>
              </div>
              {request.urgency === "high" && (
                <div className="ml-auto flex items-center gap-1.5 rounded-full bg-amber-100 border border-amber-200 px-2.5 py-1">
                  <AlertTriangle className="h-3 w-3 text-amber-600" />
                  <span className="text-xs text-amber-700 font-medium">Required</span>
                </div>
              )}
            </div>

            {/* Form Fields */}
            <div className="p-5 space-y-4">
              {request.fields?.map((field) => (
                <div key={field.name}>
                  {field.type === "select" ? (
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium text-slate-700">{field.label}</label>
                      <select
                        value={formData[field.name] || ""}
                        onChange={(e) => {
                          setFormData((p) => ({ ...p, [field.name]: e.target.value }));
                          setErrors((p) => ({ ...p, [field.name]: "" }));
                        }}
                        className="w-full rounded-lg bg-white border border-slate-200 text-slate-800 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/30 focus:border-indigo-400 transition-colors"
                      >
                        <option value="">Select...</option>
                        {field.options?.map((opt) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                      {errors[field.name] && (
                        <p className="text-xs text-red-500">{errors[field.name]}</p>
                      )}
                    </div>
                  ) : (
                    <Input
                      label={field.label}
                      type={field.type}
                      placeholder={field.placeholder}
                      value={formData[field.name] || ""}
                      onChange={(e) => {
                        setFormData((p) => ({ ...p, [field.name]: e.target.value }));
                        setErrors((p) => ({ ...p, [field.name]: "" }));
                      }}
                      error={errors[field.name]}
                    />
                  )}
                </div>
              ))}

              {/* Security note for payment/login */}
              {(request.type === "payment" || request.type === "amazon_login") && (
                <div className="flex items-start gap-2 rounded-lg bg-emerald-50 border border-emerald-200 p-3">
                  <Shield className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
                  <p className="text-xs text-emerald-700">
                    Your data is stored locally only and never sent to external servers.
                    This application runs entirely on your machine.
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 border-t border-slate-100 p-5">
              <Button variant="secondary" onClick={onDismiss}>
                Cancel
              </Button>
              <Button onClick={handleSubmit}>
                Submit &amp; Continue
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
