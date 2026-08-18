"use client";

import React, { useEffect } from "react";
import { X, User as UserIcon, Mail, Phone, Calendar, Shield, AlertCircle } from "lucide-react";
import { AdminUserResponse } from "../../types";
import { AdminBadge } from "../AdminBadge";

interface AdminUserDetailModalProps {
  user: AdminUserResponse | null;
  isOpen: boolean;
  onClose: () => void;
}

export function AdminUserDetailModal({
  user,
  isOpen,
  onClose,
}: AdminUserDetailModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !user) return null;

  const isDeleted = Boolean(user.deletedAt);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="user-detail-title"
        className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-700 border border-teal-200 flex items-center justify-center font-bold text-base">
              {user.name ? user.name.charAt(0).toUpperCase() : "U"}
            </div>
            <div>
              <h3 id="user-detail-title" className="text-lg font-extrabold text-slate-900">
                {user.name}
              </h3>
              <p className="text-xs text-slate-500 font-medium">User ID: {user.id}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Status and Role Banner */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
            <div className="space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Account Standing
              </span>
              <div className="flex items-center gap-2">
                <AdminBadge type={user.status} />
                <AdminBadge type={user.role} />
                {isDeleted && <AdminBadge type="CANCELLED" label="Soft Deleted" />}
              </div>
            </div>

            {isDeleted && (
              <div className="flex items-center gap-1.5 text-xs font-bold text-rose-600 bg-rose-50 px-3 py-1.5 rounded-xl border border-rose-200">
                <AlertCircle className="w-4 h-4" />
                Deactivated Account
              </div>
            )}
          </div>

          {/* Contact & Profile Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl border border-slate-100 bg-white space-y-1">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                <Mail className="w-3.5 h-3.5" />
                Email Address
              </div>
              <p className="text-sm font-bold text-slate-900 break-all">{user.email}</p>
            </div>

            <div className="p-4 rounded-2xl border border-slate-100 bg-white space-y-1">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                <Phone className="w-3.5 h-3.5" />
                Phone Number
              </div>
              <p className="text-sm font-bold text-slate-900">
                {user.phone || <span className="text-slate-400 font-normal">Not provided</span>}
              </p>
            </div>

            <div className="p-4 rounded-2xl border border-slate-100 bg-white space-y-1">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                <Shield className="w-3.5 h-3.5" />
                Platform Role
              </div>
              <p className="text-sm font-bold text-slate-900">{user.role}</p>
            </div>

            <div className="p-4 rounded-2xl border border-slate-100 bg-white space-y-1">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                <Calendar className="w-3.5 h-3.5" />
                Registered On
              </div>
              <p className="text-sm font-bold text-slate-900">
                {new Date(user.createdAt).toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>

          {/* Audit Metadata */}
          <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Audit & Governance Records
            </h4>
            <div className="text-xs text-slate-600 space-y-1">
              <p>
                <span className="font-semibold text-slate-700">Last Updated:</span>{" "}
                {new Date(user.updatedAt).toLocaleString()}
              </p>
              {user.deletedAt && (
                <p>
                  <span className="font-semibold text-rose-700">Deactivated At:</span>{" "}
                  {new Date(user.deletedAt).toLocaleString()}
                </p>
              )}
              {user.deletedBy && (
                <p>
                  <span className="font-semibold text-slate-700">Deactivated By:</span>{" "}
                  {user.deletedBy}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-4 bg-slate-50 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
