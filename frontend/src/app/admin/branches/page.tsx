"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import api from "@/lib/api";
import { Branch, Product } from "@/lib/types";
import { MapPin, ChevronDown, ChevronUp, AlertTriangle } from "lucide-react";

export default function AdminBranchesPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [stock, setStock] = useState<Record<number, any[]>>({});
  const [selectedBranch, setSelectedBranch] = useState<number | null>(null);
  const [stockUpdate, setStockUpdate] = useState<{ product_id: number; quantity: number }>({
    product_id: 0,
    quantity: 0,
  });
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!loading && (!user || user.role !== "admin")) router.push("/login");
  }, [user, loading]);

  useEffect(() => {
    api.get("/branches/").then((res) => setBranches(res.data));
    api.get("/products/").then((res) => setProducts(res.data));
  }, []);

  const loadStock = async (branchId: number) => {
    const res = await api.get(`/branches/${branchId}/stock`);
    setStock((prev) => ({ ...prev, [branchId]: res.data }));
    setSelectedBranch(branchId);
  };

  const updateStock = async (branchId: number) => {
    if (!stockUpdate.product_id || stockUpdate.quantity < 0) return;
    try {
      await api.post(`/branches/${branchId}/stock`, stockUpdate);
      setMessage("Stock updated!");
      loadStock(branchId);
      setTimeout(() => setMessage(""), 3000);
    } catch (err: any) {
      setMessage(err.response?.data?.detail || "Update failed");
    }
  };

  const toggleBranch = async (branchId: number) => {
    try {
      const res = await api.patch(`/branches/${branchId}/toggle`);
      setBranches((prev) => prev.map((b) => (b.id === branchId ? res.data : b)));
    } catch (err: any) {
      alert(err.response?.data?.detail || "Toggle failed");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Branches</h1>
          <p className="text-gray-400 text-sm mt-1">Manage branch stock and availability</p>
        </div>

        {message && (
          <div className="bg-gray-900 text-white px-5 py-3 rounded-xl mb-6 text-sm flex items-center gap-2">
            <span className="w-4 h-4 bg-white rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-gray-900 text-xs font-bold">✓</span>
            </span>
            {message}
          </div>
        )}

          <div className="grid grid-cols-1 gap-4">
          {branches.map((branch) => (
            <div key={branch.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              {/* Branch Header */}
              <div className="px-6 py-5">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">{branch.name}</h3>
                    <div className="flex items-center gap-1.5 mt-1">
                      <MapPin size={12} className="text-gray-400" />
                      <span className="text-sm text-gray-400">{branch.address}</span>
                    </div>
                    <p className="text-xs text-gray-300 mt-0.5">
                      {branch.latitude}, {branch.longitude}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium border ${
                      branch.is_active
                        ? "bg-green-50 text-green-700 border-green-100"
                        : "bg-gray-100 text-gray-500 border-gray-200"
                    }`}>
                      {branch.is_active ? "Active" : "Inactive"}
                    </span>
                    <button
                      onClick={() => toggleBranch(branch.id)}
                      className="text-xs text-gray-400 hover:text-gray-900 transition-colors"
                    >
                      {branch.is_active ? "Deactivate" : "Activate"}
                    </button>
                  </div>
                </div>
              </div>

              {/* Stock Toggle */}
              <div className="border-t border-gray-50">
                <button
                  onClick={() =>
                    selectedBranch === branch.id
                      ? setSelectedBranch(null)
                      : loadStock(branch.id)
                  }
                  className="w-full px-6 py-3 flex items-center justify-between text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  <span>Stock Management</span>
                  {selectedBranch === branch.id
                    ? <ChevronUp size={16} className="text-gray-400" />
                    : <ChevronDown size={16} className="text-gray-400" />
                  }
                </button>

                {selectedBranch === branch.id && (
                  <div className="px-6 pb-5 space-y-4 border-t border-gray-50">
                    {/* Current Stock */}
                    <div className="pt-4 space-y-2">
                      {stock[branch.id] && stock[branch.id].length > 0 ? (
                        stock[branch.id].map((item) => (
                          <div key={item.product_id} className="flex justify-between items-center text-sm">
                            <span className="text-gray-600">{item.product_name}</span>
                            <div className="flex items-center gap-2">
                              {item.quantity < 10 && (
                                <AlertTriangle size={12} className="text-yellow-500" />
                              )}
                              <span className={`font-medium ${
                                item.quantity < 10 ? "text-yellow-600" : "text-gray-900"
                              }`}>
                                {item.quantity} units
                              </span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-gray-400 py-2">No stock data available</p>
                      )}
                    </div>

                    {/* Update Stock */}
                    <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                      <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                        Update Stock
                      </p>
                      <select
                        value={stockUpdate.product_id}
                        onChange={(e) => setStockUpdate((prev) => ({
                          ...prev, product_id: Number(e.target.value),
                        }))}
                        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-gray-300 bg-white text-gray-700 accent-gray-700"
                      >
                        <option value={0}>Select product</option>
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          min={0}
                          value={stockUpdate.quantity}
                          onChange={(e) => setStockUpdate((prev) => ({
                            ...prev, quantity: Number(e.target.value),
                          }))}
                          placeholder="Quantity"
                          className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white"
                        />
                        <button
                          onClick={() => updateStock(branch.id)}
                          className="bg-gray-900 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors"
                        >
                          Update
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}