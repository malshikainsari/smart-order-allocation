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

export default function OrdersPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading]);

  useEffect(() => {
    api
      .get("/orders/")
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
      <div className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">My Orders</h1>

        {fetching ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <p className="text-lg">No orders yet</p>
            <a href="/products" className="text-blue-600 hover:underline mt-2 block">
              Browse products
            </a>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div
                key={order.id}
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="font-bold text-gray-900">
                        Order #{order.id}
                      </h3>
                      <span
                        className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                          statusColors[order.status]
                        }`}
                      >
                        {order.status.charAt(0).toUpperCase() +
                          order.status.slice(1)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      {new Date(order.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-blue-600 text-lg">
                      Rs. {order.total_amount.toLocaleString()}
                    </p>
                    {order.branch && (
                      <p className="text-sm text-gray-500">
                        📍 {order.branch.name}
                      </p>
                    )}
                  </div>
                </div>

                {/* Items */}
                <div className="border-t pt-3 mb-3">
                  <div className="space-y-1">
                    {order.items.map((item, i) => (
                      <div
                        key={i}
                        className="flex justify-between text-sm text-gray-600"
                      >
                        <span>
                          {item.product_name} × {item.quantity}
                        </span>
                        <span>
                          Rs.{" "}
                          {(item.unit_price * item.quantity).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Note & ML Classification */}
                {order.customer_note && (
                  <div className="bg-gray-50 rounded-lg p-3 mb-3">
                    <p className="text-sm text-gray-600">
                      📝 {order.customer_note}
                    </p>
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

                {/* Allocation Score */}
                {order.allocation_score && (
                  <p className="text-xs text-gray-400 mb-3">
                    Allocation score: {(order.allocation_score * 100).toFixed(1)}%
                  </p>
                )}

                {/* Cancel Button */}
                {!["delivered", "cancelled"].includes(order.status) && (
                  <button
                    onClick={() => cancelOrder(order.id)}
                    className="text-sm text-red-500 hover:text-red-700 transition font-medium"
                  >
                    Cancel Order
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}