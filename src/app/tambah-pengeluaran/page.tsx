"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Header from "../../components/header";
import Sidebar from "../../components/sidebar";
import { createClient } from "../../lib/supabase";
import {
  FaCalendarAlt,
  FaCheckCircle,
  FaTimesCircle,
  FaMoneyBillWave,
} from "react-icons/fa";

const jenisPengeluaran = [
  "Makanan & Minuman",
  "Transportasi",
  "Listrik",
  "Internet & Pulsa",
  "Kebutuhan Kos",
  "Keperluan Kuliah",
  "Hiburan",
  "Kesehatan",
  "Belanja",
  "Lain-lain",
];

export default function TambahPengeluaranPage() {
  const router = useRouter();
  const supabase = createClient();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [formTanggal, setFormTanggal] = useState("");
  const [formJenis, setFormJenis] = useState(jenisPengeluaran[0]);
  const [formJumlah, setFormJumlah] = useState("");
  const [formKeterangan, setFormKeterangan] = useState("");

  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const resetForm = () => {
    setFormTanggal("");
    setFormJenis(jenisPengeluaran[0]);
    setFormJumlah("");
    setFormKeterangan("");
  };

  const handleSimpan = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMsg("");

    if (!formTanggal || !formJumlah || !formKeterangan) {
      return;
    }

    setIsSaving(true);

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setErrorMsg("Sesi login tidak ditemukan. Silakan login kembali.");
      setIsSaving(false);
      router.push("/login");
      return;
    }

    const { error: insertError } = await supabase.from("pengeluaran").insert({
      user_id: user.id,
      tanggal: formTanggal,
      jenis: formJenis,
      jumlah: Number(formJumlah),
      keterangan: formKeterangan,
    });

    setIsSaving(false);

    if (insertError) {
      setErrorMsg("Gagal menyimpan pengeluaran. Silakan coba lagi.");
      console.error("Insert error:", insertError.message);
      return;
    }

    setShowSuccess(true);
    resetForm();

    setTimeout(() => {
      setShowSuccess(false);
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] relative overflow-hidden">
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      <Sidebar
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
      />

      <main className="md:ml-64 flex flex-col min-h-screen relative">
        <Header setIsSidebarOpen={setIsSidebarOpen} />

        <div className="flex-1 p-5 md:p-6">
          {showSuccess && (
            <div className="flex items-center gap-2 mb-4 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2">
              <FaCheckCircle />
              <span>Pengeluaran berhasil disimpan.</span>
            </div>
          )}

          {errorMsg && (
            <div className="flex items-center gap-2 mb-4 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              <FaTimesCircle />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="w-full bg-[#111827] border border-white/10 rounded-xl shadow-lg shadow-black/20 p-5">
            <div className="flex items-center gap-2.5 mb-5">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-lg shadow-indigo-500/30 shrink-0">
                <FaMoneyBillWave className="text-white text-sm" />
              </div>

              <div>
                <h2 className="text-sm font-bold text-gray-100">
                  Form Pengeluaran
                </h2>
              </div>
            </div>

            <form onSubmit={handleSimpan}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-4">
                <div>
                  <label className="block text-xs font-medium mb-1.5 text-gray-300">
                    Tanggal
                  </label>
                  <div className="relative">
                    <FaCalendarAlt className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs pointer-events-none" />
                    <input
                      type="date"
                      value={formTanggal}
                      onChange={(e) => setFormTanggal(e.target.value)}
                      required
                      disabled={isSaving}
                      className="w-full pl-9 pr-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/60 focus:border-indigo-500/60 transition [color-scheme:dark] disabled:opacity-60"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1.5 text-gray-300">
                    Jenis Pengeluaran
                  </label>
                  <select
                    value={formJenis}
                    onChange={(e) => setFormJenis(e.target.value)}
                    disabled={isSaving}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/60 focus:border-indigo-500/60 transition [&>option]:bg-[#111827] disabled:opacity-60"
                  >
                    {jenisPengeluaran.map((jenis) => (
                      <option key={jenis} value={jenis}>
                        {jenis}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1.5 text-gray-300">
                    Jumlah (Rp)
                  </label>
                  <input
                    type="number"
                    min={0}
                    placeholder="Contoh: 150000"
                    value={formJumlah}
                    onChange={(e) => setFormJumlah(e.target.value)}
                    required
                    disabled={isSaving}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/60 focus:border-indigo-500/60 transition disabled:opacity-60"
                  />
                </div>

                <div className="md:col-span-1">
                  <label className="block text-xs font-medium mb-1.5 text-gray-300">
                    Keterangan
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Beli kabel dan konektor"
                    value={formKeterangan}
                    onChange={(e) => setFormKeterangan(e.target.value)}
                    required
                    disabled={isSaving}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/60 focus:border-indigo-500/60 transition disabled:opacity-60"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-5">
                <button
                  type="button"
                  onClick={resetForm}
                  disabled={isSaving}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-gray-300 bg-white/5 hover:bg-white/10 transition disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  Reset
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 rounded-lg text-xs font-semibold text-white bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 shadow-lg shadow-indigo-500/20 transition disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isSaving ? "Menyimpan..." : "Simpan Pengeluaran"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}