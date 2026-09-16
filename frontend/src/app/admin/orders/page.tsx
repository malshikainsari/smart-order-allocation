"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import api from "@/lib/api";
import { Order } from "@/lib/types";
import { Search, MapPin, MessageSquare, Tag } from "lucide-react";

const statusConfig: Record<string, { label: string; class: string }> = {
  pending: { label: "Pending", class: "bg-yellow-50 text-yellow-700 border border-yellow-100" },
  allocated: { label: "Allocated", class: "bg-blue-50 text-blue-700 border border-blue-100" },
  preparing: { label: "Preparing", class: "bg-purple-50 text-purple-700 border border-purple-100" },
  delivered: { label: "Delivered", class: "bg-green-50 text-green-700 border border-green-100" },
  cancelled: { label: "Cancelled", class: "bg-gray-100 text-gray-500 border border-gray-200" },
};

const statusOptions = ["pending", "allocated", "preparing", "delivered", "cancelled"];

export default function AdminOrdersPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [fetching, setFetching] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!loading && (!user || user.role !== "admin")) router.push("/login");
  }, [user, loading]);

  useEffect(() => {
    api.get("/orders/")
      .then((res) => setOrders(res.data))
      .finally(() => setFetching(false));
  }, []);

  const updateStatus = async (id: number, status: string) => {
    try {
      await api.patch(`/orders/${id}/status`, { status });
      setOrders((prev) =>
        prev.map((o) => (o.id === id ? { ...o, status: status as Order["status"] } : o))
      );
    } catch (err: any) {
      alert(err.response?.data?.detail || "Update failed");
    }
  };

  const filtered = orders.filter((o) =>
    o.id.toString().includes(search) ||
    o.status.includes(search.toLowerCase()) ||
    o.branch?.name.toLowerCase().includes(search.toLowerCase()) ||
    o.customer_address?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">All Orders</h1>
            <p className="text-gray-400 text-sm mt-1">{orders.length} total orders</p>
          </div>
          <div className="relative">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search orders..."
              className="pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 w-64 bg-white"
            />
          </div>
        </div>

        {fetching ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-900 border-t-transparent" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-400">No orders found</div>
        ) : (
          <div className="space-y-4">
            {filtered.map((order) => (
              <div key={order.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                {/* Header */}
                <div className="px-6 py-4 flex items-center justify-between border-b border-gray-50">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-gray-900">Order #{order.id}</span>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusConfig[order.status].class}`}>
                      {statusConfig[order.status].label}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-400">
                      {new Date(order.created_at).toLocaleDateString("en-GB", {
                        day: "numeric", month: "short", year: "numeric",
                      })}
                    </span>
                    <span className="font-bold text-gray-900">
                      Rs. {order.total_amount.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Body */}
                <div className="px-6 py-4 space-y-4">
                  {/* Items */}
                  <div className="space-y-1.5">
                    {order.items.map((item, i) => (
                      <div key={i} className="flex justify-between text-sm">
                        <span className="text-gray-600">
                          {item.product_name}
                          <span className="text-gray-400 ml-1">×{item.quantity}</span>
                        </span>
                        <span className="text-gray-900 font-medium">
                          Rs. {(item.unit_price * item.quantity).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Meta */}
                  <div className="flex flex-wrap gap-4 text-xs text-gray-400">
                    {order.branch && (
                      <div className="flex items-center gap-1.5">
                        <MapPin size={11} />
                        <span>{order.branch.name}</span>
                      </div>
                    )}
                    {order.customer_address && (
                      <div className="flex items-center gap-1.5">
                        <MapPin size={11} />
                        <span>{order.customer_address}</span>
                      </div>
                    )}
                    {order.allocation_score && (
                      <span>Allocation score: {(order.allocation_score * 100).toFixed(0)}%</span>
                    )}
                  </div>

                  {/* Note & ML */}
                  {order.customer_note && (
                    <div className="bg-gray-50 rounded-xl p-3 space-y-2">
                      <div className="flex items-start gap-2">
                        <MessageSquare size={13} className="text-gray-400 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-gray-600">{order.customer_note}</p>
                      </div>
                      {order.note_category && (
                        <div className="flex items-center gap-2 pl-5">
                          <Tag size={11} className="text-gray-400" />
                          <span className="text-xs font-medium text-gray-700">{order.note_category}</span>
                          <span className="text-xs text-gray-400">{order.note_confidence}% confidence</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Status Update */}
                  <div className="flex items-center gap-3 pt-1">
                    <span className="text-xs text-gray-400 font-medium">Update status:</span>
                    <select
                      value={order.status}
                      onChange={(e) => updateStatus(order.id, e.target.value)}
                                            className="border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-gray-300 bg-white text-gray-700 accent-gray-700"
                    >
                      {statusOptions.map((s) => (
                        <option key={s} value={s}>
                          {s.charAt(0).toUpperCase() + s.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}