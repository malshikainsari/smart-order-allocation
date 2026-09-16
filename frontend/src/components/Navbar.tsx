"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  ShoppingCart,
  Package,
  LayoutDashboard,
  LogOut,
  ShoppingBag,
  Building2,
  Menu,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  if (!user) return null;

  const isAdmin = user.role === "admin";

  const navLinks = isAdmin
    ? [
        {
          href: "/admin/dashboard",
          label: "Dashboard",
          icon: LayoutDashboard,
        },
        {
          href: "/admin/branches",
          label: "Branches",
          icon: Building2,
        },
        {
          href: "/admin/orders",
          label: "Orders",
          icon: ShoppingCart,
        },
      ]
    : [
        {
          href: "/products",
          label: "Products",
          icon: Package,
        },
        {
          href: "/orders",
          label: "My Orders",
          icon: ShoppingCart,
        },
      ];

  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-50 w-full">
      <div className="w-full px-4">
        <div className="flex justify-between items-center h-16">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0">
            <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center">
              <ShoppingBag size={16} className="text-white" />
            </div>

            <span className="font-bold text-gray-900 text-lg">
              SmartOrder
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden sm:flex items-center gap-1 ml-6 mr-auto">
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

          {/* Right Side */}
          <div className="flex items-center gap-2 ml-auto">

            {/* User Avatar */}
            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center shrink-0">
              <span className="text-xs font-bold text-gray-600">
                {user.name.charAt(0).toUpperCase()}
              </span>
            </div>

            {/* Desktop Logout */}
            <button
              onClick={logout}
              className="hidden sm:flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-900 transition-all px-3 py-2 rounded-lg hover:bg-gray-50"
            >
              <LogOut size={15} />
              <span>Logout</span>
            </button>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="sm:hidden w-9 h-9 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-50"
              aria-label="Toggle menu"
            >
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <div className="sm:hidden border-t border-gray-100 py-3">
            <div className="flex flex-col gap-1">
              {navLinks.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium ${
                    pathname === href
                      ? "bg-gray-900 text-white"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <Icon size={17} />
                  {label}
                </Link>
              ))}

              {/* Mobile Logout */}
              <button
                onClick={logout}
                className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-50 text-left"
              >
                <LogOut size={17} />
                Logout
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}