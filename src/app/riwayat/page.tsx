"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "../../components/header";
import Sidebar from "../../components/sidebar";
import { createClient } from "../../lib/supabase";
import {
  FaFilter,
  FaCalendarAlt,
  FaMoneyBillWave,
  FaTimesCircle,
  FaChevronLeft,
  FaChevronRight,
  FaEdit,
  FaTrash,
  FaTimes,
  FaExclamationTriangle,
} from "react-icons/fa";
import toast from "react-hot-toast";

type Pengeluaran = {
  id: string;
  tanggal: string;
  jenis: string;
  jumlah: number;
  keterangan: string;
};

const namaBulan = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

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

const ITEMS_PER_PAGE = 10;

export default function RiwayatPengeluaranPage() {
  const router = useRouter();
  const supabase = createClient();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const today = new Date();

  const [bulanFilter, setBulanFilter] = useState<string>(
    String(today.getMonth() + 1)
  );
  const [tahunFilter, setTahunFilter] = useState<string>(
    String(today.getFullYear())
  );

  const [data, setData] = useState<Pengeluaran[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  const [currentPage, setCurrentPage] = useState(1);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formTanggal, setFormTanggal] = useState("");
  const [formJenis, setFormJenis] = useState("");
  const [formJumlah, setFormJumlah] = useState("");
  const [formKeterangan, setFormKeterangan] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<Pengeluaran | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const daftarTahun = useMemo(() => {
    const tahunSekarang = today.getFullYear();
    return Array.from({ length: 6 }, (_, i) => tahunSekarang - i);
  }, []);

  const formatRupiah = (value: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(value);

  const fetchData = async () => {
    setIsLoading(true);
    setErrorMsg("");
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/");
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
        .eq("user_id", user.id)
        .gte("tanggal", awalBulan)
        .lte("tanggal", akhirBulan)
        .order("tanggal", { ascending: false })
        .order("id", { ascending: false });

      if (error) {
        console.error("Fetch error:", error.message);
        setErrorMsg("Gagal memuat data pengeluaran.");
        setData([]);
      } else {
        setData(rows ?? []);
      }
      setCurrentPage(1);
    } catch (error) {
      console.error(error);
      setErrorMsg("Terjadi kesalahan saat memuat data.");
      setData([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [bulanFilter, tahunFilter]);

  const totalFiltered = data.reduce(
    (acc, item) => acc + Number(item.jumlah),
    0
  );

  const totalPages = Math.ceil(data.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentData = data.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const resetFilter = () => {
    setBulanFilter(String(today.getMonth() + 1));
    setTahunFilter(String(today.getFullYear()));
    setCurrentPage(1);
  };

  const handlePrevious = () => {
    if (currentPage > 1) setCurrentPage((prev) => prev - 1);
  };

  const handleNext = () => {
    if (currentPage < totalPages) setCurrentPage((prev) => prev + 1);
  };

  const openEdit = (item: Pengeluaran) => {
    setEditingId(item.id);
    setFormTanggal(item.tanggal);
    setFormJenis(item.jenis);
    setFormJumlah(String(item.jumlah));
    setFormKeterangan(item.keterangan || "");
    setErrorMsg("");
    setIsModalOpen(true);
  };

  const closeModal = () => {
    if (isSaving) return;
    setIsModalOpen(false);
    setEditingId(null);
    setFormTanggal("");
    setFormJenis("");
    setFormJumlah("");
    setFormKeterangan("");
  };

  const handleUpdate = async () => {
    if (!editingId) return;

    if (!formTanggal || !formJenis || !formJumlah) {
      toast.error("Tanggal, jenis, dan jumlah wajib diisi.");
      return;
    }

    const jumlah = Number(formJumlah);
    if (jumlah <= 0) {
      toast.error("Jumlah pengeluaran harus lebih dari 0.");
      return;
    }

    setIsSaving(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/");
        return;
      }

      const { error } = await supabase
        .from("pengeluaran")
        .update({
          tanggal: formTanggal,
          jenis: formJenis,
          jumlah,
          keterangan: formKeterangan,
        })
        .eq("id", editingId)
        .eq("user_id", user.id);

      if (error) {
        console.error("Update error:", error.message);
        toast.error("Gagal mengubah pengeluaran.");
        return;
      }

      toast.success("Pengeluaran berhasil diubah.");
      setIsModalOpen(false);
      setEditingId(null);
      setFormTanggal("");
      setFormJenis("");
      setFormJumlah("");
      setFormKeterangan("");
      await fetchData();
    } catch (error) {
      console.error(error);
      toast.error("Terjadi kesalahan saat mengubah data.");
    } finally {
      setIsSaving(false);
    }
  };

  const openDeleteConfirm = (item: Pengeluaran) => {
    setDeleteTarget(item);
  };

  const closeDeleteConfirm = () => {
    if (deletingId) return;
    setDeleteTarget(null);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const id = deleteTarget.id;

    setDeletingId(id);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/");
        return;
      }

      const { error } = await supabase
        .from("pengeluaran")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) {
        console.error("Delete error:", error.message);
        toast.error("Gagal menghapus pengeluaran.");
        return;
      }

      setData((prev) => prev.filter((item) => item.id !== id));
      toast.success("Pengeluaran berhasil dihapus.");
      setDeleteTarget(null);
    } catch (error) {
      console.error(error);
      toast.error("Terjadi kesalahan saat menghapus data.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] relative overflow-hidden">
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      <Sidebar isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />

      <main className="md:ml-64 flex flex-col min-h-screen relative">
        <Header setIsSidebarOpen={setIsSidebarOpen} />

        <div className="flex-1 p-4 sm:p-6">
          {errorMsg && (
            <div className="flex items-center gap-2 mb-4 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              <FaTimesCircle />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="bg-[#111827] border border-white/10 rounded-2xl shadow-lg shadow-black/20 p-4 sm:p-6 mb-6">
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
                    onChange={(e) => {
                      setBulanFilter(e.target.value);
                      setCurrentPage(1);
                    }}
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
                  onChange={(e) => {
                    setTahunFilter(e.target.value);
                    setCurrentPage(1);
                  }}
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
                    <th className="px-6 py-4 font-semibold text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-10 text-center text-gray-500">
                        Memuat data pengeluaran...
                      </td>
                    </tr>
                  ) : data.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-10 text-center text-gray-500">
                        Tidak ada pengeluaran pada periode ini.
                      </td>
                    </tr>
                  ) : (
                    currentData.map((item) => (
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
                          {formatRupiah(Number(item.jumlah))}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => openEdit(item)}
                              disabled={deletingId === item.id}
                              className="w-9 h-9 flex items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500/20 hover:text-indigo-300 transition disabled:opacity-50"
                              title="Edit"
                            >
                              <FaEdit size={13} />
                            </button>
                            <button
                              onClick={() => openDeleteConfirm(item)}
                              disabled={deletingId === item.id}
                              className="w-9 h-9 flex items-center justify-center rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 hover:text-red-300 transition disabled:opacity-50"
                              title="Hapus"
                            >
                              {deletingId === item.id ? (
                                <span className="w-3.5 h-3.5 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin" />
                              ) : (
                                <FaTrash size={12} />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {!isLoading && data.length > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 border-t border-white/10">
                <p className="text-xs text-gray-500">
                  Menampilkan{" "}
                  <span className="text-gray-300 font-semibold">{startIndex + 1}</span>
                  {" - "}
                  <span className="text-gray-300 font-semibold">
                    {Math.min(startIndex + ITEMS_PER_PAGE, data.length)}
                  </span>
                  {" dari "}
                  <span className="text-gray-300 font-semibold">{data.length}</span>
                  {" riwayat"}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePrevious}
                    disabled={currentPage === 1}
                    className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold border transition ${currentPage === 1 ? "text-gray-600 border-white/5 bg-white/[0.02] cursor-not-allowed" : "text-gray-300 border-white/10 bg-white/5 hover:bg-white/10"}`}
                  >
                    <FaChevronLeft size={10} />
                    Sebelumnya
                  </button>
                  <span className="px-3 py-2 text-xs text-gray-400">
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    onClick={handleNext}
                    disabled={currentPage === totalPages}
                    className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold border transition ${currentPage === totalPages ? "text-gray-600 border-white/5 bg-white/[0.02] cursor-not-allowed" : "text-gray-300 border-white/10 bg-white/5 hover:bg-white/10"}`}
                  >
                    Berikutnya
                    <FaChevronRight size={10} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-[#111827] border border-white/10 rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-white/10">
              <div>
                <h2 className="text-sm font-semibold text-gray-100">Edit Pengeluaran</h2>
                <p className="text-[11px] text-gray-500 mt-0.5">Ubah data pengeluaran</p>
              </div>
              <button
                onClick={closeModal}
                disabled={isSaving}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition"
              >
                <FaTimes size={13} />
              </button>
            </div>

            <div className="p-4 sm:p-5 space-y-3">
              <div>
                <label className="block text-[11px] font-medium text-gray-400 mb-1.5">Tanggal</label>
                <div className="relative">
                  <FaCalendarAlt className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs pointer-events-none" />
                  <input
                    type="date"
                    value={formTanggal}
                    onChange={(e) => setFormTanggal(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-white/5 border border-white/10 rounded-lg text-xs text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/60"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-gray-400 mb-1.5">Jenis Pengeluaran</label>
                <select
                  value={formJenis}
                  onChange={(e) => setFormJenis(e.target.value)}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-xs text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/60 [&>option]:bg-[#111827]"
                >
                  <option value="">Pilih jenis pengeluaran</option>
                  {jenisPengeluaran.map((jenis) => (
                    <option key={jenis} value={jenis}>
                      {jenis}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-gray-400 mb-1.5">Jumlah</label>
                <div className="relative">
                  <FaMoneyBillWave className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs pointer-events-none" />
                  <input
                    type="number"
                    min="0"
                    value={formJumlah}
                    onChange={(e) => setFormJumlah(e.target.value)}
                    placeholder="Masukkan jumlah"
                    className="w-full pl-9 pr-3 py-2 bg-white/5 border border-white/10 rounded-lg text-xs text-gray-100 placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/60"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-gray-400 mb-1.5">Keterangan</label>
                <textarea
                  value={formKeterangan}
                  onChange={(e) => setFormKeterangan(e.target.value)}
                  rows={2}
                  placeholder="Masukkan keterangan..."
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-xs text-gray-100 placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/60 resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
                <button
                  onClick={closeModal}
                  disabled={isSaving}
                  className="px-3.5 py-2 rounded-lg text-[11px] font-semibold text-gray-300 bg-white/5 border border-white/10 hover:bg-white/10 transition"
                >
                  Batal
                </button>
                <button
                  onClick={handleUpdate}
                  disabled={isSaving}
                  className="px-4 py-2 rounded-lg text-[11px] font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition disabled:opacity-50"
                >
                  {isSaving ? "Menyimpan..." : "Simpan Perubahan"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-xs bg-[#111827] border border-white/10 rounded-2xl shadow-2xl">
            <div className="p-5 flex flex-col items-center text-center gap-3">
              <div className="w-11 h-11 flex items-center justify-center rounded-full bg-red-500/10 border border-red-500/20 text-red-400">
                <FaExclamationTriangle size={16} />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-gray-100">Hapus Pengeluaran?</h2>
                <p className="text-xs text-gray-500 mt-1">
                  Data{" "}
                  <span className="text-gray-300 font-medium">
                    {deleteTarget.keterangan || deleteTarget.jenis}
                  </span>{" "}
                  akan dihapus permanen dan tidak bisa dikembalikan.
                </p>
              </div>
              <div className="flex w-full gap-2 pt-2">
                <button
                  onClick={closeDeleteConfirm}
                  disabled={!!deletingId}
                  className="flex-1 px-3.5 py-2.5 rounded-lg text-xs font-semibold text-gray-300 bg-white/5 border border-white/10 hover:bg-white/10 transition disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  onClick={handleDelete}
                  disabled={!!deletingId}
                  className="flex-1 px-3.5 py-2.5 rounded-lg text-xs font-semibold text-white bg-red-600 hover:bg-red-500 transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {deletingId ? (
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    "Hapus"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}