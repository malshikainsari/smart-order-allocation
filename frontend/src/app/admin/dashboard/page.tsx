"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import api from "@/lib/api";
import { DashboardStats } from "@/lib/types";
import {
  ShoppingCart,
  Package,
  Building2,
  CheckCircle,
  Clock,
  XCircle,
  Truck,
} from "lucide-react";

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

  const statCards = stats
    ? [
        { label: "Total Orders", value: stats.total_orders, icon: ShoppingCart, color: "blue" },
        { label: "Pending", value: stats.pending_orders, icon: Clock, color: "yellow" },
        { label: "Allocated", value: stats.allocated_orders, icon: Package, color: "purple" },
        { label: "Delivered", value: stats.delivered_orders, icon: CheckCircle, color: "green" },
        { label: "Cancelled", value: stats.cancelled_orders, icon: XCircle, color: "red" },
        { label: "Active Branches", value: `${stats.active_branches}/${stats.total_branches}`, icon: Building2, color: "indigo" },
        { label: "Products", value: stats.total_products, icon: Truck, color: "teal" },
      ]
    : [];

  const colorMap: Record<string, string> = {
    blue: "bg-blue-50 text-blue-600",
    yellow: "bg-yellow-50 text-yellow-600",
    purple: "bg-purple-50 text-purple-600",
    green: "bg-green-50 text-green-600",
    red: "bg-red-50 text-red-600",
    indigo: "bg-indigo-50 text-indigo-600",
    teal: "bg-teal-50 text-teal-600",
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">Admin Dashboard</h1>

        {!stats ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
              {statCards.map(({ label, value, icon: Icon, color }) => (
                <div key={label} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${colorMap[color]}`}>
                    <Icon size={20} />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{value}</p>
                  <p className="text-sm text-gray-500 mt-0.5">{label}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <a href="/admin/orders" className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:border-blue-300 transition group">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center group-hover:bg-blue-100 transition">
                    <ShoppingCart size={24} className="text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Manage Orders</h3>
                    <p className="text-sm text-gray-500">View and update order statuses</p>
                  </div>
                </div>
              </a>

              <a href="/admin/branches" className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:border-blue-300 transition group">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center group-hover:bg-indigo-100 transition">
                    <Building2 size={24} className="text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Manage Branches</h3>
                    <p className="text-sm text-gray-500">View branches and stock levels</p>
                  </div>
                </div>
              </a>
            </div>
          </>
        )}
      </div>
    </div>
  );
}