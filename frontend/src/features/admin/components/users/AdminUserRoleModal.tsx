"use client";

import React, { useState, useEffect } from "react";
import { X, Shield, AlertTriangle } from "lucide-react";
import { AdminUserResponse, UserRole } from "../../types";

interface AdminUserRoleModalProps {
  user: AdminUserResponse | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (userId: string, newRole: UserRole) => Promise<void>;
}

export function AdminUserRoleModal({
  user,
  isOpen,
  onClose,
  onConfirm,
}: AdminUserRoleModalProps) {
  const [selectedRole, setSelectedRole] = useState<UserRole>("USER");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setSelectedRole(user.role);
      setError(null);
    }
  }, [user]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !isLoading) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isLoading, onClose]);

  if (!isOpen || !user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedRole === user.role) {
      onClose();
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await onConfirm(user.id, selectedRole);
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to update user role");
    } finally {
      setIsLoading(false);
    }
  };

  const roles: { role: UserRole; label: string; desc: string }[] = [
    {
      role: "USER",
      label: "Buyer (USER)",
      desc: "Standard buyer access: catalog browsing, RFQ submission, and purchase order management.",
    },
    {
      role: "SUPPLIER",
      label: "Supplier (SUPPLIER)",
      desc: "Supplier organization access: catalog management, RFQ quotation, and order fulfillment.",
    },
    {
      role: "ADMIN",
      label: "Administrator (ADMIN)",
      desc: "Full governance access: user administration, moderation, and transaction oversight.",
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="role-modal-title"
        className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-purple-50 text-purple-700 border border-purple-200">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 id="role-modal-title" className="text-base font-extrabold text-slate-900">
                Change Platform Role
              </h3>
              <p className="text-xs text-slate-500 font-medium">{user.name} ({user.email})</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-50"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">
            {error && (
              <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-700">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-3">
              {roles.map((r) => {
                const isSelected = selectedRole === r.role;
                return (
                  <label
                    key={r.role}
                    className={`flex items-start gap-3 p-4 rounded-2xl border cursor-pointer transition-all ${
                      isSelected
                        ? "bg-purple-50/60 border-purple-300 ring-2 ring-purple-500/20"
                        : "bg-white border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="role"
                      value={r.role}
                      checked={isSelected}
                      onChange={() => setSelectedRole(r.role)}
                      className="mt-1 text-purple-600 focus:ring-purple-500"
                    />
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-slate-900">{r.label}</p>
                      <p className="text-[11px] text-slate-500 leading-relaxed">{r.desc}</p>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 bg-slate-50 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || selectedRole === user.role}
              className="flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 active:bg-purple-800 rounded-xl shadow-xs transition-colors disabled:opacity-50"
            >
              {isLoading && (
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              )}
              Update Role
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
