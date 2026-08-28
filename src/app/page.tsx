"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  FaEnvelope,
  FaLock,
  FaEye,
  FaEyeSlash,
  FaWallet,
} from "react-icons/fa";
import { createClient } from "../lib/supabase";

export default function AdminLogin() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    setError("");
    setIsLoading(true);

    try {
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (loginError) {
        setError("Email atau password salah.");
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Terjadi kesalahan saat login.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0B0F19] px-4">
      {/* Background Glow */}
      <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-indigo-600/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-blue-600/20 blur-3xl" />

      {/* Card */}
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-[#111827] shadow-2xl shadow-black/40 backdrop-blur-xl">
        {/* Header */}
        <div className="border-b border-white/5 px-6 pb-6 pt-8 text-center">
          {/* Logo */}
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 shadow-lg shadow-indigo-500/30">
            <FaWallet className="text-xl text-white" />
          </div>

          {/* Brand */}
          <h1 className="text-lg font-bold tracking-[0.2em] text-white">
            ADELIFY
          </h1>
        </div>

        {/* Form Section */}
        <div className="p-6">
          {/* Title */}
          <div className="mb-6 text-center">
            <h2 className="text-base font-semibold text-gray-100">
              Masuk Ke Dashboard
            </h2>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2.5 text-center text-xs text-red-400">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-medium text-gray-300"
              >
                Email
              </label>

              <div className="relative">
                <FaEnvelope className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500" />
                <input
                  id="email"
                  type="email"
                  placeholder="admin@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="w-full rounded-lg border border-white/10 bg-white/5 py-3 pl-10 pr-4 text-sm text-gray-100 placeholder-gray-500 outline-none transition focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-medium text-gray-300"
              >
                Password
              </label>

              <div className="relative">
                <FaLock className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="w-full rounded-lg border border-white/10 bg-white/5 py-3 pl-10 pr-12 text-sm text-gray-100 placeholder-gray-500 outline-none transition focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/20"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={
                    showPassword
                      ? "Sembunyikan password"
                      : "Tampilkan password"
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 transition hover:text-indigo-400"
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-lg bg-gradient-to-r from-indigo-500 to-blue-600 py-3 font-semibold text-white shadow-lg shadow-indigo-500/20 transition hover:from-indigo-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? "Memproses..." : "Masuk"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}