"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { FaBars } from "react-icons/fa";
import { createClient } from "../lib/supabase";

type HeaderProps = {
  setIsSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
};

export default function Header({ setIsSidebarOpen }: HeaderProps) {
  const pathname = usePathname();
  const [userEmail, setUserEmail] = useState("");
  const supabase = createClient();

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user?.email) {
        setUserEmail(user.email);
      }
    };

    getUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user?.email) {
        setUserEmail(session.user.email);
      } else {
        setUserEmail("");
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  let title = "Dashboard";
  if (pathname === "/dashboard") {
    title = "Dashboard";
  } else if (pathname === "/tambah-pengeluaran") {
    title = "Tambah Pengeluaran";
  } else if (pathname === "/riwayat") {
    title = "Riwayat";
  }

  const userInitial = userEmail ? userEmail.charAt(0).toUpperCase() : "";

  return (
    <header className="bg-[#111827] border-b border-white/10 h-16 flex items-center px-4 md:px-8 justify-between shrink-0">
      {/* Left */}
      <div className="flex items-center gap-3 -ml-2">
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="p-2 text-gray-400 hover:bg-white/5 hover:text-gray-100 rounded-lg md:hidden transition-colors"
          aria-label="Open Sidebar"
        >
          <FaBars size={20} />
        </button>

        <h2 className="text-lg md:text-xl font-bold text-gray-100">
          {title}
        </h2>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2 md:gap-4">
        {/* Avatar */}
        <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 text-white flex items-center justify-center font-bold text-sm md:text-base shadow-lg shadow-indigo-500/20">
          {userInitial || "?"}
        </div>

        {/* User Info */}
        <div className="hidden sm:block text-left">
          <p className="text-xs md:text-sm font-bold text-gray-100">
            {userEmail || "Memuat..."}
          </p>
        </div>
      </div>
    </header>
  );
}