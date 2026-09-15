"use client";

import { useAuth } from "@/context/AuthContext";
import { ShoppingCart, Package, LayoutDashboard, LogOut } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  if (!user) return null;

  const isAdmin = user.role === "admin";

  const navLinks = isAdmin
    ? [
        { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
        { href: "/admin/branches", label: "Branches", icon: Package },
        { href: "/admin/orders", label: "Orders", icon: ShoppingCart },
      ]
    : [
        { href: "/products", label: "Products", icon: Package },
        { href: "/orders", label: "My Orders", icon: ShoppingCart },
      ];

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-8">
            <Link href="/" className="text-xl font-bold text-blue-600">
              SmartOrder
            </Link>
            <div className="flex items-center gap-1">
              {navLinks.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
                    pathname === href
                      ? "bg-blue-50 text-blue-600"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <Icon size={16} />
                  {label}
                </Link>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              {user.name}
              {isAdmin && (
                <span className="ml-2 bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full">
                  Admin
                </span>
              )}
            </span>
            <button
              onClick={logout}
              className="flex items-center gap-2 text-sm text-gray-500 hover:text-red-500 transition"
            >
              <LogOut size={16} />
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}