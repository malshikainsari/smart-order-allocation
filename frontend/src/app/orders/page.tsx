"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import api from "@/lib/api";
import { Order } from "@/lib/types";
import { ShoppingCart, MapPin, MessageSquare, Tag, X } from "lucide-react";

const statusConfig: Record<string, { label: string; class: string }> = {
  pending: { label: "Pending", class: "bg-yellow-50 text-yellow-700 border border-yellow-100" },
  allocated: { label: "Allocated", class: "bg-blue-50 text-blue-700 border border-blue-100" },
  preparing: { label: "Preparing", class: "bg-purple-50 text-purple-700 border border-purple-100" },
  delivered: { label: "Delivered", class: "bg-green-50 text-green-700 border border-green-100" },
  cancelled: { label: "Cancelled", class: "bg-gray-100 text-gray-500 border border-gray-200" },
};

export default function OrdersPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading]);

  useEffect(() => {
    api.get("/orders/")
      .then((res) => setOrders(res.data))
      .finally(() => setFetching(false));
  }, []);

  const cancelOrder = async (id: number) => {
    try {
      await api.patch(`/orders/${id}/cancel`);
      setOrders((prev) =>
        prev.map((o) => (o.id === id ? { ...o, status: "cancelled" } : o))
      );
    } catch (err: any) {
      alert(err.response?.data?.detail || "Cancel failed");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">My Orders</h1>
          <p className="text-gray-400 text-sm mt-1">Track and manage your orders</p>
        </div>

        {fetching ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-900 border-t-transparent" />
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-20">
            <ShoppingCart size={40} className="text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 font-medium">No orders yet</p>
            <a href="/products" className="text-gray-900 font-semibold text-sm hover:underline mt-2 block">
              Browse products →
            </a>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                {/* Header */}
                <div className="px-4 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 border-b border-gray-50">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-gray-900">Order #{order.id}</span>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusConfig[order.status].class}`}>
                      {statusConfig[order.status].label}
                    </span>
                  </div>
                  <span className="text-xs text-gray-400">
                    {new Date(order.created_at).toLocaleDateString("en-GB", {
                      day: "numeric", month: "short", year: "numeric",
                      hour: "2-digit", minute: "2-digit"
                    })}
                  </span>
                </div>

                {/* Body */}
                <div className="px-4 sm:px-6 py-4 space-y-4">
                  {/* Items */}
                  <div className="space-y-2">
                    {order.items.map((item, i) => (
                      <div key={i} className="flex justify-between text-sm">
                        <span className="text-gray-600">
                          {item.product_name}
                          <span className="text-gray-400 ml-1">×{item.quantity}</span>
                        </span>
                        <span className="font-medium text-gray-900">
                          Rs. {(item.unit_price * item.quantity).toLocaleString()}
                        </span>
                      </div>
                    ))}
                    <div className="flex justify-between text-sm pt-2 border-t border-gray-50">
                      <span className="font-semibold text-gray-900">Total</span>
                      <span className="font-bold text-gray-900">
                        Rs. {order.total_amount.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Meta info */}
                  <div className="flex flex-wrap gap-4 text-xs text-gray-400">
                    {order.branch && (
                      <div className="flex items-center gap-1.5">
                        <MapPin size={12} />
                        <span>{order.branch.name}</span>
                      </div>
                    )}
                    {order.customer_address && (
                      <div className="flex items-center gap-1.5">
                        <MapPin size={12} />
                        <span>{order.customer_address}</span>
                      </div>
                    )}
                    {order.allocation_score && (
                      <div className="flex items-center gap-1.5">
                        <span>Score: {(order.allocation_score * 100).toFixed(0)}%</span>
                      </div>
                    )}
                  </div>

                  {/* Note & ML classification */}
                  {order.customer_note && (
                    <div className="bg-gray-50 rounded-xl p-3 space-y-2">
                      <div className="flex items-start gap-2">
                        <MessageSquare size={13} className="text-gray-400 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-gray-600">{order.customer_note}</p>
                      </div>
                      {order.note_category && (
                        <div className="flex items-center gap-2 pl-5">
                          <Tag size={11} className="text-gray-400" />
                          <span className="text-xs font-medium text-gray-700">
                            {order.note_category}
                          </span>
                          <span className="text-xs text-gray-400">
                            {order.note_confidence}% confidence
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Footer */}
                {!["delivered", "cancelled"].includes(order.status) && (
                  <div className="px-6 py-3 border-t border-gray-50 flex justify-end">
                    <button
                      onClick={() => cancelOrder(order.id)}
                      className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-red-500 transition-colors font-medium"
                    >
                      <X size={13} />
                      Cancel Order
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}