// app/(dashboard)/admin/students/create/page.tsx
import Link from "next/link";
import { ArrowLeft, Save, User, ShieldCheck, GraduationCap, Phone } from "lucide-react";
import { createStudent } from "./actions";

export default function CreateStudentPage() {
  const currentYear = new Date().getFullYear();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/students" className="p-2 bg-white text-gray-500 hover:text-blue-600 rounded-xl shadow-sm border border-gray-100 transition">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">Pendaftaran Santri Baru</h2>
          <p className="text-sm text-gray-500 mt-1">Masukkan data otentikasi dan profil akademik santri.</p>
        </div>
      </div>

      <form action={createStudent} className="space-y-6">
        
        {/* KOTAK 1: Akun Login */}
        <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-blue-600"></div>
          <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-blue-600" /> Informasi Akun (Login)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-1">Nama Lengkap Santri</label>
              <input type="text" name="name" required placeholder="Sesuai Akta Kelahiran" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
              <input type="email" name="email" required placeholder="santri@pesantren.com" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Kata Sandi (Password)</label>
              <input type="password" name="password" required placeholder="Minimal 6 karakter" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition" />
            </div>
          </div>
        </div>

        {/* KOTAK 2: Profil Akademik & Biodata */}
        <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
          <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-emerald-500" /> Data Akademik & Pribadi
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Nomor Induk Santri (NIS)</label>
              <input type="text" name="nis" required placeholder="Contoh: 2026001" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none transition" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Tahun Masuk (Angkatan)</label>
              <input type="number" name="enrollYear" defaultValue={currentYear} required className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none transition" />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Jenis Kelamin</label>
              <div className="flex gap-4">
                <label className="flex items-center flex-1 bg-gray-50 border border-gray-200 px-4 py-3 rounded-xl cursor-pointer hover:bg-emerald-50 transition">
                  <input type="radio" name="gender" value="LAKI_LAKI" required className="text-emerald-600 focus:ring-emerald-500 w-4 h-4" />
                  <span className="ml-3 font-medium text-gray-700">Laki-laki</span>
                </label>
                <label className="flex items-center flex-1 bg-gray-50 border border-gray-200 px-4 py-3 rounded-xl cursor-pointer hover:bg-emerald-50 transition">
                  <input type="radio" name="gender" value="PEREMPUAN" required className="text-emerald-600 focus:ring-emerald-500 w-4 h-4" />
                  <span className="ml-3 font-medium text-gray-700">Perempuan</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Tempat Lahir</label>
              <input type="text" name="birthPlace" placeholder="Kota Kelahiran" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none transition" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Tanggal Lahir</label>
              <input type="date" name="birthDate" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none transition" />
            </div>
          </div>
        </div>

        {/* KOTAK 3: Data Wali */}
        <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-orange-400"></div>
          <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Phone className="w-5 h-5 text-orange-500" /> Informasi Orang Tua / Wali
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Nama Wali</label>
              <input type="text" name="parentName" placeholder="Nama Lengkap Wali" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-orange-500 focus:outline-none transition" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Nomor WhatsApp Wali</label>
              <input type="text" name="parentPhone" placeholder="08123456789" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-orange-500 focus:outline-none transition" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-1">Alamat Lengkap</label>
              <textarea name="address" rows={3} placeholder="Alamat domisili saat ini..." className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-orange-500 focus:outline-none transition"></textarea>
            </div>
          </div>
        </div>

        {/* Tombol Simpan */}
        <div className="flex justify-end pt-4 pb-10">
          <button type="submit" className="flex items-center gap-2 bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 transition shadow-md hover:shadow-lg">
            <Save className="w-5 h-5" /> Simpan Data Santri
          </button>
        </div>
        
      </form>
    </div>
  );
}