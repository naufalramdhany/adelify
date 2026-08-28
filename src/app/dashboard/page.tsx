"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  FaWallet,
  FaCalendarDay,
  FaCoins,
  FaTimesCircle,
} from "react-icons/fa";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import Header from "../../components/header";
import Sidebar from "../../components/sidebar";
import { createClient } from "../../lib/supabase";

type Pengeluaran = {
  id: string;
  tanggal: string;
  jenis: string;
  jumlah: number;
  keterangan: string;
};

type DataBulan = {
  bulan: string;
  total: number;
};

type DataJenis = {
  nama: string;
  total: number;
  color: string;
};

const WARNA_JENIS = [
  "#6366F1",
  "#10B981",
  "#F59E0B",
  "#EC4899",
  "#6B7280",
  "#3B82F6",
  "#EF4444",
  "#8B5CF6",
];

const NAMA_BULAN = [
  "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
  "Jul", "Agu", "Sep", "Okt", "Nov", "Des",
];

const formatRupiah = (value: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(value);

export default function DashboardPage() {
  const router = useRouter();
  const supabase = createClient();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [pengeluaranHariIni, setPengeluaranHariIni] = useState(0);
  const [pengeluaranBulanIni, setPengeluaranBulanIni] = useState(0);
  const [totalPengeluaran, setTotalPengeluaran] = useState(0);

  const [dataPengeluaran6Bulan, setDataPengeluaran6Bulan] = useState<DataBulan[]>([]);
  const [dataJenisPengeluaran, setDataJenisPengeluaran] = useState<DataJenis[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      setErrorMsg("");

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/");
        return;
      }

      const { data: rows, error } = await supabase
        .from("pengeluaran")
        .select("id, tanggal, jenis, jumlah, keterangan")
        .order("tanggal", { ascending: false });

      if (error) {
        console.error("Fetch dashboard error:", error.message);
        setErrorMsg("Gagal memuat data dashboard.");
        setIsLoading(false);
        return;
      }

      const pengeluaran: Pengeluaran[] = rows ?? [];

      const today = new Date();
      const tahunSekarang = today.getFullYear();
      const bulanSekarang = today.getMonth() + 1;

      const tanggalHariIni = `${tahunSekarang}-${String(bulanSekarang).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

      const totalHariIni = pengeluaran
        .filter((item) => item.tanggal === tanggalHariIni)
        .reduce((acc, item) => acc + Number(item.jumlah), 0);
      setPengeluaranHariIni(totalHariIni);

      const totalBulanIni = pengeluaran
        .filter((item) => {
          const tanggal = new Date(item.tanggal);
          return (
            tanggal.getFullYear() === tahunSekarang &&
            tanggal.getMonth() + 1 === bulanSekarang
          );
        })
        .reduce((acc, item) => acc + Number(item.jumlah), 0);
      setPengeluaranBulanIni(totalBulanIni);

      const totalSemua = pengeluaran.reduce(
        (acc, item) => acc + Number(item.jumlah),
        0
      );
      setTotalPengeluaran(totalSemua);

      const enamBulan: DataBulan[] = [];
      for (let i = 5; i >= 0; i--) {
        const tanggal = new Date(
          tahunSekarang,
          today.getMonth() - i,
          1
        );

        const tahun = tanggal.getFullYear();
        const bulan = tanggal.getMonth();

        const total = pengeluaran
          .filter((item) => {
            const tanggalItem = new Date(item.tanggal);
            return (
              tanggalItem.getFullYear() === tahun &&
              tanggalItem.getMonth() === bulan
            );
          })
          .reduce((acc, item) => acc + Number(item.jumlah), 0);

        enamBulan.push({
          bulan: NAMA_BULAN[bulan],
          total,
        });
      }
      setDataPengeluaran6Bulan(enamBulan);

      const jenisMap: Record<string, number> = {};
      pengeluaran
        .filter((item) => {
          const tanggal = new Date(item.tanggal);
          return (
            tanggal.getFullYear() === tahunSekarang &&
            tanggal.getMonth() + 1 === bulanSekarang
          );
        })
        .forEach((item) => {
          const jenis = item.jenis || "Lainnya";
          jenisMap[jenis] = (jenisMap[jenis] || 0) + Number(item.jumlah);
        });

      const dataJenis: DataJenis[] = Object.entries(jenisMap).map(
        ([nama, total], index) => ({
          nama,
          total,
          color: WARNA_JENIS[index % WARNA_JENIS.length],
        })
      );
      setDataJenisPengeluaran(dataJenis);

      setIsLoading(false);
    };

    fetchDashboardData();
  }, [supabase, router]);

  const totalJenisPengeluaran = dataJenisPengeluaran.reduce(
    (acc, item) => acc + item.total,
    0
  );

  const cards = [
    {
      label: "Pengeluaran Hari Ini",
      value: formatRupiah(pengeluaranHariIni),
      icon: FaCalendarDay,
      color: "from-indigo-500 to-blue-600",
      textColor: "text-blue-400",
    },
    {
      label: "Pengeluaran Bulan Ini",
      value: formatRupiah(pengeluaranBulanIni),
      icon: FaWallet,
      color: "from-emerald-500 to-green-600",
      textColor: "text-emerald-400",
    },
    {
      label: "Total Pengeluaran",
      value: formatRupiah(totalPengeluaran),
      icon: FaCoins,
      color: "from-rose-500 to-red-600",
      textColor: "text-rose-400",
    },
  ];

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

        <div className="flex-1 p-6">
          <div className="mb-6">
            <h1 className="text-xl font-bold text-gray-100">
              Ringkasan Dashboard
            </h1>
          </div>

          {errorMsg && (
            <div className="flex items-center gap-2 mb-4 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              <FaTimesCircle />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 mb-6">
            {cards.map(({ label, value, icon: Icon, color, textColor }) => (
              <div
                key={label}
                className="bg-[#111827] border border-white/10 rounded-2xl shadow-lg shadow-black/20 p-6 hover:border-white/20 transition"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-sm text-gray-400">{label}</h3>
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center shadow-lg`}>
                    <Icon className="text-white text-sm" />
                  </div>
                </div>

                <p className={`text-2xl font-bold mt-4 ${textColor}`}>
                  {isLoading ? "Memuat..." : value}
                </p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2 bg-[#111827] border border-white/10 rounded-2xl shadow-lg shadow-black/20 p-6">
              <h3 className="text-sm text-gray-400 mb-4">
                Pengeluaran 6 Bulan Terakhir
              </h3>

              <div className="h-56 w-full">
                {isLoading ? (
                  <div className="h-full flex items-center justify-center text-sm text-gray-500">
                    Memuat grafik...
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={dataPengeluaran6Bulan}
                      margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" />
                      <XAxis dataKey="bulan" stroke="#9CA3AF" fontSize={12} />
                      <YAxis
                        stroke="#9CA3AF"
                        fontSize={12}
                        tickFormatter={(val: number) => `${(val / 1000000).toFixed(1)}jt`}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#1F2937",
                          border: "1px solid rgba(255,255,255,0.1)",
                          borderRadius: "0.75rem",
                          color: "#F3F4F6",
                        }}
                        formatter={(val) => (val !== undefined ? formatRupiah(Number(val)) : "-")}
                      />
                      <Line
                        type="monotone"
                        dataKey="total"
                        stroke="#6366F1"
                        strokeWidth={3}
                        dot={{ fill: "#6366F1", r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            <div className="bg-[#111827] border border-white/10 rounded-2xl shadow-lg shadow-black/20 p-6">
              <h3 className="text-sm text-gray-400 mb-4">
                Jenis Pengeluaran Bulan Ini
              </h3>

              {isLoading ? (
                <div className="h-32 flex items-center justify-center text-sm text-gray-500">
                  Memuat data...
                </div>
              ) : dataJenisPengeluaran.length === 0 ? (
                <div className="h-32 flex items-center justify-center text-sm text-gray-500">
                  Belum ada data pengeluaran bulan ini.
                </div>
              ) : (
                <div className="flex items-center gap-4">
                  <div className="h-32 w-32 shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={dataJenisPengeluaran}
                          dataKey="total"
                          nameKey="nama"
                          innerRadius={32}
                          outerRadius={52}
                          paddingAngle={2}
                        >
                          {dataJenisPengeluaran.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#1F2937",
                            border: "1px solid rgba(255,255,255,0.1)",
                            borderRadius: "0.75rem",
                            color: "#F3F4F6",
                          }}
                          formatter={(val) => (val !== undefined ? formatRupiah(Number(val)) : "-")}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="flex-1 space-y-3">
                    {dataJenisPengeluaran.map((item) => {
                      const persen = totalJenisPengeluaran > 0
                        ? ((item.total / totalJenisPengeluaran) * 100).toFixed(0)
                        : "0";

                      return (
                        <div key={item.nama}>
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <span
                                className="w-2.5 h-2.5 rounded-full shrink-0"
                                style={{ backgroundColor: item.color }}
                              />
                              <span className="text-xs text-gray-300">
                                {item.nama}
                              </span>
                            </div>
                            <span className="text-xs text-gray-400">
                              {persen}%
                            </span>
                          </div>

                          <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${persen}%`,
                                backgroundColor: item.color,
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}