"use client";

import { useAuth } from "@/context/AuthContext";
import { ShoppingCart, Package, LayoutDashboard, LogOut, ShoppingBag, Building2 } from "lucide-react";
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
        { href: "/admin/branches", label: "Branches", icon: Building2 },
        { href: "/admin/orders", label: "Orders", icon: ShoppingCart },
      ]
    : [
        { href: "/products", label: "Products", icon: Package },
        { href: "/orders", label: "My Orders", icon: ShoppingCart },
      ];

  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
      <div className="w-full px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center">
                <ShoppingBag size={16} className="text-white" />
              </div>
              <span className="font-bold text-gray-900 text-lg">SmartOrder</span>
            </Link>

            {/* Nav Links */}
            <div className="flex items-center gap-1">
              {navLinks.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    pathname === href
                      ? "bg-gray-900 text-white"
                      : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  <Icon size={15} />
                  {label}
                </Link>
              ))}
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                <span className="text-xs font-bold text-gray-600">
                  {user.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-medium text-gray-900">{user.name}</p>
                {isAdmin && (
                  <p className="text-xs text-gray-400">Administrator</p>
                )}
              </div>
            </div>

            <button
              onClick={logout}
              className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-900 transition-all px-3 py-2 rounded-lg hover:bg-gray-50"
            >
              <LogOut size={15} />
              <span className="hidden sm:block">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}