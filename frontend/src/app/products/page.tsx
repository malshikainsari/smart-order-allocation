"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import api from "@/lib/api";
import { Product } from "@/lib/types";
import { ShoppingCart, Plus, Minus, Package } from "lucide-react";

export default function ProductsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<{ [key: number]: number }>({});
  const [note, setNote] = useState("");
  const [address, setAddress] = useState("");
  const [ordering, setOrdering] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!loading && !user) router.push("/login");
    if (!loading && user?.role === "admin") router.push("/admin/dashboard");
  }, [user, loading]);

  useEffect(() => {
    api.get("/products/").then((res) => setProducts(res.data));
  }, []);

  const updateCart = (id: number, delta: number) => {
    setCart((prev) => {
      const current = prev[id] || 0;
      const next = Math.max(0, current + delta);
      if (next === 0) {
        const { [id]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [id]: next };
    });
  };

  const cartTotal = Object.entries(cart).reduce((sum, [id, qty]) => {
    const product = products.find((p) => p.id === Number(id));
    return sum + (product?.price || 0) * qty;
  }, 0);

  const cartCount = Object.values(cart).reduce((a, b) => a + b, 0);

  const placeOrder = async () => {
    if (cartCount === 0) return;
    setOrdering(true);
    setError("");
    setSuccess("");
    try {
      const items = Object.entries(cart).map(([product_id, quantity]) => ({
        product_id: Number(product_id),
        quantity,
      }));
      const res = await api.post("/orders/", {
        items,
        customer_note: note || undefined,
        customer_address: address || undefined,
      });
      setSuccess(
        `Order #${res.data.id} placed! ${
          res.data.branch
            ? `Allocated to ${res.data.branch.name}`
            : "Pending allocation"
        }`
      );
      setCart({});
      setNote("");
      setAddress("");
    } catch (err: any) {
      setError(err.response?.data?.detail || "Order failed");
    } finally {
      setOrdering(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-8">

        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="text-gray-400 text-sm mt-1">Select items to place your order</p>
        </div>

        {success && (
          <div className="bg-gray-900 text-white px-5 py-4 rounded-xl mb-6 flex items-center gap-3">
            <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-gray-900 text-xs font-bold">✓</span>
            </div>
            {success}
          </div>
        )}
        {error && (
          <div className="bg-red-50 border border-red-100 text-red-600 px-5 py-4 rounded-xl mb-6 text-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Products Grid */}
          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {products.map((product) => (
              <div
                key={product.id}
                className="bg-white rounded-2xl border border-gray-100 p-5 hover:border-gray-200 hover:shadow-sm transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                    <Package size={18} className="text-gray-500" />
                  </div>
                  <span className="text-lg font-bold text-gray-900">
                    Rs. {product.price.toLocaleString()}
                  </span>
                </div>

                <h3 className="font-semibold text-gray-900 mb-1">{product.name}</h3>
                {product.description && (
                  <p className="text-xs text-gray-400 mb-4">{product.description}</p>
                )}

                <div className="flex items-center justify-between mt-auto">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => updateCart(product.id, -1)}
                      className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-all"
                    >
                      <Minus size={13} />
                    </button>
                    <span className="w-6 text-center font-semibold text-gray-900 text-sm">
                      {cart[product.id] || 0}
                    </span>
                    <button
                      onClick={() => updateCart(product.id, 1)}
                      className="w-8 h-8 rounded-lg bg-gray-900 flex items-center justify-center hover:bg-gray-800 transition-all"
                    >
                      <Plus size={13} className="text-white" />
                    </button>
                  </div>
                  {cart[product.id] > 0 && (
                    <span className="text-xs text-gray-400 font-medium">
                      Rs. {(product.price * cart[product.id]).toLocaleString()}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 h-fit sticky top-20">
            <div className="flex items-center gap-2 mb-5">
              <ShoppingCart size={18} className="text-gray-900" />
              <h2 className="font-bold text-gray-900">Order Summary</h2>
              {cartCount > 0 && (
                <span className="ml-auto bg-gray-900 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                  {cartCount}
                </span>
              )}
            </div>

            {cartCount === 0 ? (
              <div className="text-center py-8">
                <ShoppingCart size={32} className="text-gray-200 mx-auto mb-2" />
                <p className="text-gray-400 text-sm">No items selected</p>
              </div>
            ) : (
              <div className="space-y-2 mb-5">
                {Object.entries(cart).map(([id, qty]) => {
                  const product = products.find((p) => p.id === Number(id));
                  return (
                    <div key={id} className="flex justify-between text-sm">
                      <span className="text-gray-500">
                        {product?.name} <span className="text-gray-400">×{qty}</span>
                      </span>
                      <span className="font-medium text-gray-900">
                        Rs. {((product?.price || 0) * qty).toLocaleString()}
                      </span>
                    </div>
                  );
                })}
                <div className="border-t border-gray-100 pt-3 mt-3 flex justify-between">
                  <span className="font-semibold text-gray-900">Total</span>
                  <span className="font-bold text-gray-900">
                    Rs. {cartTotal.toLocaleString()}
                  </span>
                </div>
              </div>
            )}

            <div className="space-y-3 mt-4">
              <input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Delivery address (optional)"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 text-gray-900 placeholder-gray-400"
              />
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Order note — e.g. payment issue, delivery query..."
                rows={3}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 text-gray-900 placeholder-gray-400 resize-none"
              />
            </div>

            <button
              onClick={placeOrder}
              disabled={cartCount === 0 || ordering}
              className="w-full mt-4 bg-gray-900 text-white py-3 rounded-xl font-semibold text-sm hover:bg-gray-800 disabled:opacity-40 transition-all active:scale-[0.98]"
            >
              {ordering ? "Placing order..." : "Place Order"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}