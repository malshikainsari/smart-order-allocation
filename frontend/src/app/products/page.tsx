"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import api from "@/lib/api";
import { Product } from "@/lib/types";
import { ShoppingCart, Plus, Minus } from "lucide-react";

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
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Products</h1>

        {success && (
          <div className="bg-green-50 text-green-700 px-4 py-3 rounded-lg mb-6 font-medium">
            ✅ {success}
          </div>
        )}
        {error && (
          <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg mb-6">
            ❌ {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Products Grid */}
          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {products.map((product) => (
              <div
                key={product.id}
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-5"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">{product.name}</h3>
                    {product.description && (
                      <p className="text-sm text-gray-500 mt-0.5">
                        {product.description}
                      </p>
                    )}
                  </div>
                  <span className="text-blue-600 font-bold">
                    Rs. {product.price.toLocaleString()}
                  </span>
                </div>

                <div className="flex items-center gap-3 mt-4">
                  <button
                    onClick={() => updateCart(product.id, -1)}
                    className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="w-8 text-center font-medium">
                    {cart[product.id] || 0}
                  </span>
                  <button
                    onClick={() => updateCart(product.id, 1)}
                    className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 h-fit sticky top-20">
            <h2 className="font-bold text-gray-900 text-lg mb-4 flex items-center gap-2">
              <ShoppingCart size={20} />
              Order Summary
            </h2>

            {cartCount === 0 ? (
              <p className="text-gray-400 text-sm">No items selected</p>
            ) : (
              <div className="space-y-2 mb-4">
                {Object.entries(cart).map(([id, qty]) => {
                  const product = products.find((p) => p.id === Number(id));
                  return (
                    <div key={id} className="flex justify-between text-sm">
                      <span className="text-gray-600">
                        {product?.name} × {qty}
                      </span>
                      <span className="font-medium">
                        Rs. {((product?.price || 0) * qty).toLocaleString()}
                      </span>
                    </div>
                  );
                })}
                <div className="border-t pt-2 flex justify-between font-bold">
                  <span>Total</span>
                  <span className="text-blue-600">
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
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Order note (optional) — e.g. payment issue, delivery query..."
                rows={3}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            <button
              onClick={placeOrder}
              disabled={cartCount === 0 || ordering}
              className="w-full mt-4 bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition"
            >
              {ordering ? "Placing order..." : `Place Order (${cartCount} items)`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}