"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "../../components/header";
import Sidebar from "../../components/sidebar";
import { createClient } from "../../lib/supabase";
import { FaFilter, FaCalendarAlt, FaMoneyBillWave, FaTimesCircle } from "react-icons/fa";

type Pengeluaran = {
  id: string;
  tanggal: string;
  jenis: string;
  jumlah: number;
  keterangan: string;
};

const namaBulan = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

export default function RiwayatPengeluaranPage() {
  const router = useRouter();
  const supabase = createClient();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const today = new Date();
  const [bulanFilter, setBulanFilter] = useState<string>(String(today.getMonth() + 1));
  const [tahunFilter, setTahunFilter] = useState<string>(String(today.getFullYear()));

  const daftarTahun = useMemo(() => {
    const tahunSekarang = today.getFullYear();
    return Array.from({ length: 6 }, (_, i) => tahunSekarang - i);
  }, []);

  const [data, setData] = useState<Pengeluaran[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  const formatRupiah = (value: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(value);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setErrorMsg("");

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const bulan = Number(bulanFilter);
      const tahun = Number(tahunFilter);

      const awalBulan = `${tahun}-${String(bulan).padStart(2, "0")}-01`;
      const akhirTanggal = new Date(tahun, bulan, 0).getDate();
      const akhirBulan = `${tahun}-${String(bulan).padStart(2, "0")}-${String(akhirTanggal).padStart(2, "0")}`;

      const { data: rows, error } = await supabase
        .from("pengeluaran")
        .select("id, tanggal, jenis, jumlah, keterangan")
        .gte("tanggal", awalBulan)
        .lte("tanggal", akhirBulan)
        .order("tanggal", { ascending: false });

      if (error) {
        setErrorMsg("Gagal memuat data pengeluaran.");
        console.error("Fetch error:", error.message);
        setData([]);
      } else {
        setData(rows ?? []);
      }

      setIsLoading(false);
    };

    fetchData();
  }, [bulanFilter, tahunFilter]);

  const totalFiltered = data.reduce((acc, item) => acc + item.jumlah, 0);

  const resetFilter = () => {
    setBulanFilter(String(today.getMonth() + 1));
    setTahunFilter(String(today.getFullYear()));
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] relative overflow-hidden">
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      <Sidebar isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />

      <main className="md:ml-64 flex flex-col min-h-screen relative">
        <Header setIsSidebarOpen={setIsSidebarOpen} />

        <div className="flex-1 p-6">
          {errorMsg && (
            <div className="flex items-center gap-2 mb-4 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              <FaTimesCircle />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="bg-[#111827] border border-white/10 rounded-2xl shadow-lg shadow-black/20 p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <FaFilter className="text-indigo-400" />
              <h2 className="text-sm font-semibold text-gray-200">Filter Periode</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-medium mb-2 text-gray-400">Bulan</label>
                <div className="relative">
                  <FaCalendarAlt className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm pointer-events-none" />
                  <select
                    value={bulanFilter}
                    onChange={(e) => setBulanFilter(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/60 focus:border-indigo-500/60 transition [&>option]:bg-[#111827]"
                  >
                    {namaBulan.map((nama, index) => (
                      <option key={nama} value={index + 1}>
                        {nama}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium mb-2 text-gray-400">Tahun</label>
                <select
                  value={tahunFilter}
                  onChange={(e) => setTahunFilter(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/60 focus:border-indigo-500/60 transition [&>option]:bg-[#111827]"
                >
                  {daftarTahun.map((tahun) => (
                    <option key={tahun} value={tahun}>
                      {tahun}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mt-4 pt-4 border-t border-white/10">
              <p className="text-xs text-gray-500">
                {isLoading ? "Memuat data..." : `Menampilkan ${data.length} data · Total `}
                {!isLoading && (
                  <span className="text-gray-300 font-semibold">{formatRupiah(totalFiltered)}</span>
                )}
              </p>
              <button
                onClick={resetFilter}
                className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition self-start sm:self-auto"
              >
                Reset Filter
              </button>
            </div>
          </div>

          <div className="bg-[#111827] border border-white/10 rounded-2xl shadow-lg shadow-black/20 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="border-b border-white/10 text-gray-400">
                    <th className="px-6 py-4 font-semibold">Tanggal</th>
                    <th className="px-6 py-4 font-semibold">Jenis</th>
                    <th className="px-6 py-4 font-semibold">Keterangan</th>
                    <th className="px-6 py-4 font-semibold text-right">Jumlah</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-10 text-center text-gray-500">
                        Memuat data pengeluaran...
                      </td>
                    </tr>
                  ) : data.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-10 text-center text-gray-500">
                        Tidak ada pengeluaran pada periode ini.
                      </td>
                    </tr>
                  ) : (
                    data.map((item) => (
                      <tr key={item.id} className="border-b border-white/5 hover:bg-white/5 transition">
                        <td className="px-6 py-4 text-gray-400">
                          {new Date(item.tanggal).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })}
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                            <FaMoneyBillWave size={10} />
                            {item.jenis}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-300">{item.keterangan}</td>
                        <td className="px-6 py-4 text-right text-gray-100 font-semibold">
                          {formatRupiah(item.jumlah)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}