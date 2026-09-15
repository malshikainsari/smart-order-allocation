"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import api from "@/lib/api";
import { Branch, Product } from "@/lib/types";

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
      setMessage("Stock updated successfully!");
      loadStock(branchId);
      setTimeout(() => setMessage(""), 3000);
    } catch (err: any) {
      setMessage(err.response?.data?.detail || "Update failed");
    }
  };

  const toggleBranch = async (branchId: number) => {
    try {
      const res = await api.patch(`/branches/${branchId}/toggle`);
      setBranches((prev) =>
        prev.map((b) => (b.id === branchId ? res.data : b))
      );
    } catch (err: any) {
      alert(err.response?.data?.detail || "Toggle failed");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Branches</h1>

        {message && (
          <div className="bg-green-50 text-green-700 px-4 py-3 rounded-lg mb-6">
            ✅ {message}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {branches.map((branch) => (
            <div
              key={branch.id}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">{branch.name}</h3>
                  <p className="text-sm text-gray-500">📍 {branch.address}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {branch.latitude}, {branch.longitude}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span
                    className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                      branch.is_active
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {branch.is_active ? "Active" : "Inactive"}
                  </span>
                  <button
                    onClick={() => toggleBranch(branch.id)}
                    className="text-xs text-gray-500 hover:text-red-500 transition"
                  >
                    {branch.is_active ? "Deactivate" : "Activate"}
                  </button>
                </div>
              </div>

              {/* Stock Section */}
              <div className="border-t pt-4">
                <button
                  onClick={() =>
                    selectedBranch === branch.id
                      ? setSelectedBranch(null)
                      : loadStock(branch.id)
                  }
                  className="text-sm text-blue-600 hover:underline font-medium mb-3 block"
                >
                  {selectedBranch === branch.id ? "Hide Stock ▲" : "View Stock ▼"}
                </button>

                {selectedBranch === branch.id && (
                  <div className="space-y-4">
                    {/* Current Stock */}
                    {stock[branch.id] && stock[branch.id].length > 0 ? (
                      <div className="space-y-1">
                        {stock[branch.id].map((item) => (
                          <div
                            key={item.product_id}
                            className="flex justify-between text-sm"
                          >
                            <span className="text-gray-600">{item.product_name}</span>
                            <span
                              className={`font-medium ${
                                item.quantity < 10
                                  ? "text-red-500"
                                  : "text-gray-900"
                              }`}
                            >
                              {item.quantity} units
                              {item.quantity < 10 && " ⚠️"}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-400">No stock data</p>
                    )}

                    {/* Update Stock */}
                    <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                      <p className="text-xs font-medium text-gray-600">Update Stock</p>
                      <select
                        value={stockUpdate.product_id}
                        onChange={(e) =>
                          setStockUpdate((prev) => ({
                            ...prev,
                            product_id: Number(e.target.value),
                          }))
                        }
                        className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value={0}>Select product</option>
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          min={0}
                          value={stockUpdate.quantity}
                          onChange={(e) =>
                            setStockUpdate((prev) => ({
                              ...prev,
                              quantity: Number(e.target.value),
                            }))
                          }
                          placeholder="Quantity"
                          className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                          onClick={() => updateStock(branch.id)}
                          className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-sm hover:bg-blue-700 transition"
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