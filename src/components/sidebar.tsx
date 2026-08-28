"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  FaChartLine,
  FaBook,
  FaClipboardCheck,
  FaTimes,
  FaSignOutAlt,
  FaWallet,
} from "react-icons/fa";
import { createClient } from "../lib/supabase";

type SidebarProps = {
  isSidebarOpen: boolean;
  setIsSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
};

export default function Sidebar({
  isSidebarOpen,
  setIsSidebarOpen,
}: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error("Logout error:", error.message);
        return;
      }

      setIsSidebarOpen(false);
      router.push("/");
      router.refresh();
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const menuItems = [
    {
      href: "/dashboard",
      label: "Dashboard",
      icon: FaChartLine,
    },
    {
      href: "/tambah-pengeluaran",
      label: "Tambah Pengeluaran",
      icon: FaBook,
    },
    {
      href: "/riwayat",
      label: "Riwayat",
      icon: FaClipboardCheck,
    },
  ];

  const linkClass = (href: string) =>
    `w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition ${
      pathname === href
        ? "bg-gradient-to-r from-indigo-500 to-blue-600 text-white shadow-lg shadow-indigo-500/20"
        : "text-gray-400 hover:bg-white/5 hover:text-gray-100"
    }`;

  return (
    <>
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside
        className={`fixed top-0 left-0 bottom-0 w-64 bg-[#111827] border-r border-white/10 text-white z-50 md:hidden flex flex-col transition-transform duration-300 ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-6 border-b border-white/10 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-lg shadow-indigo-500/30 shrink-0">
              <FaWallet className="text-white text-sm" />
            </div>

            <div>
              <p className="text-sm font-bold text-gray-100 leading-tight">
                ADELIFY
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsSidebarOpen(false)}
            className="text-gray-500 hover:text-gray-200 transition"
          >
            <FaTimes size={20} />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setIsSidebarOpen(false)}
              className={linkClass(href)}
            >
              <Icon />
              {label}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold text-gray-400 hover:bg-red-500/10 hover:text-red-400 transition"
          >
            <FaSignOutAlt />
            Logout
          </button>
        </div>
      </aside>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex fixed top-0 left-0 h-screen w-64 bg-[#111827] border-r border-white/10 text-white flex-col z-40">
        <div className="p-6 border-b border-white/10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-lg shadow-indigo-500/30 shrink-0">
            <FaWallet className="text-white" />
          </div>

          <div>
            <p className="text-sm font-bold text-gray-100 leading-tight">
              ADELIFY
            </p>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} className={linkClass(href)}>
              <Icon />
              {label}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold text-gray-400 hover:bg-red-500/10 hover:text-red-400 transition"
          >
            <FaSignOutAlt />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}