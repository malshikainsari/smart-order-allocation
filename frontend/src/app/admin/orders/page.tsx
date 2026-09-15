"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import api from "@/lib/api";
import { Order } from "@/lib/types";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  allocated: "bg-blue-100 text-blue-700",
  preparing: "bg-purple-100 text-purple-700",
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
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
    api
      .get("/orders/")
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

  const filtered = orders.filter(
    (o) =>
      o.id.toString().includes(search) ||
      o.status.includes(search.toLowerCase()) ||
      o.branch?.name.toLowerCase().includes(search.toLowerCase()) ||
      o.customer_address?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">All Orders</h1>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by ID, status, branch..."
            className="border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
          />
        </div>

        {fetching ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-400">No orders found</div>
        ) : (
          <div className="space-y-4">
            {filtered.map((order) => (
              <div
                key={order.id}
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="font-bold text-gray-900">Order #{order.id}</h3>
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusColors[order.status]}`}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      {new Date(order.created_at).toLocaleString()}
                    </p>
                    {order.branch && (
                      <p className="text-sm text-gray-500">📍 {order.branch.name}</p>
                    )}
                    {order.customer_address && (
                      <p className="text-sm text-gray-500">🏠 {order.customer_address}</p>
                    )}
                  </div>

                  <div className="text-right">
                    <p className="font-bold text-blue-600 text-lg">
                      Rs. {order.total_amount.toLocaleString()}
                    </p>
                    {order.allocation_score && (
                      <p className="text-xs text-gray-400">
                        Score: {(order.allocation_score * 100).toFixed(1)}%
                      </p>
                    )}
                  </div>
                </div>

                {/* Items */}
                <div className="border-t pt-3 mb-3">
                  <div className="space-y-1">
                    {order.items.map((item, i) => (
                      <div key={i} className="flex justify-between text-sm text-gray-600">
                        <span>{item.product_name} × {item.quantity}</span>
                        <span>Rs. {(item.unit_price * item.quantity).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Note & ML */}
                {order.customer_note && (
                  <div className="bg-gray-50 rounded-lg p-3 mb-3">
                    <p className="text-sm text-gray-600">📝 {order.customer_note}</p>
                    {order.note_category && (
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                          {order.note_category}
                        </span>
                        <span className="text-xs text-gray-400">
                          {order.note_confidence}% confidence
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Status Update */}
                <div className="flex items-center gap-3 mt-3">
                  <label className="text-sm text-gray-600 font-medium">Update Status:</label>
                  <select
                    value={order.status}
                    onChange={(e) => updateStatus(order.id, e.target.value)}
                    className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {statusOptions.map((s) => (
                      <option key={s} value={s}>
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}