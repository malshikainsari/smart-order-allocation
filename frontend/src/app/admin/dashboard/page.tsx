"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import api from "@/lib/api";
import { DashboardStats } from "@/lib/types";
import { ShoppingCart, Package, Building2, CheckCircle, Clock, XCircle, Truck, ArrowRight } from "lucide-react";

export default function AdminDashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    if (!loading && (!user || user.role !== "admin")) router.push("/login");
  }, [user, loading]);

  useEffect(() => {
    api.get("/admin/dashboard").then((res) => setStats(res.data));
  }, []);

    const statCards = stats ? [
    { label: "Total Orders", value: stats.total_orders, icon: ShoppingCart },
    { label: "Pending", value: stats.pending_orders, icon: Clock },
    { label: "Allocated", value: stats.allocated_orders, icon: Package },
    { label: "Delivered", value: stats.delivered_orders, icon: CheckCircle },
    { label: "Cancelled", value: stats.cancelled_orders, icon: XCircle },
    { label: "Active Branches", value: `${stats.active_branches}/${stats.total_branches}`, icon: Building2 },
    { label: "Products", value: stats.total_products, icon: Truck },
  ] : [];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-400 text-sm mt-1">Overview of your order allocation system</p>
        </div>

        {!stats ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-900 border-t-transparent" />
          </div>
        ) : (
          <>
            {/* Stats Grid */}
            <div className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-8">
              {statCards.map(({ label, value, icon: Icon }) => (
                <div key={label} className="bg-white rounded-2xl border border-gray-100 p-5 hover:border-gray-200 transition-all">
                  <div className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center mb-4">
                    <Icon size={16} className="text-gray-600" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{value}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{label}</p>
                </div>
              ))}
            </div>

            {/* Quick Links */}
            <div className="grid w-full grid-cols-1 gap-3">
              <a href="/admin/orders" className="bg-white rounded-2xl border border-gray-100 p-6 hover:border-gray-200 hover:shadow-sm transition-all group">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 bg-gray-100 rounded-xl flex items-center justify-center group-hover:bg-gray-900 transition-all">
                      <ShoppingCart size={20} className="text-gray-600 group-hover:text-white transition-all" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Manage Orders</h3>
                      <p className="text-sm text-gray-400">View and update order statuses</p>
                    </div>
                  </div>
                  <ArrowRight size={18} className="text-gray-300 group-hover:text-gray-900 transition-all" />
                </div>
              </a>

              <a href="/admin/branches" className="bg-white rounded-2xl border border-gray-100 p-6 hover:border-gray-200 hover:shadow-sm transition-all group">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 bg-gray-100 rounded-xl flex items-center justify-center group-hover:bg-gray-900 transition-all">
                      <Building2 size={20} className="text-gray-600 group-hover:text-white transition-all" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Manage Branches</h3>
                      <p className="text-sm text-gray-400">View branches and stock levels</p>
                    </div>
                  </div>
                  <ArrowRight size={18} className="text-gray-300 group-hover:text-gray-900 transition-all" />
                </div>
              </a>
            </div>
          </>
        )}
      </div>
    </div>
  );
}