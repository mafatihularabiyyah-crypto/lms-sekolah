"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { 
  Building2, UserCircle, ShieldCheck, Camera, 
  Save, Loader2, Eye, EyeOff 
} from "lucide-react";
import { 
  getSettingsDataDB, updateSchoolDB, 
  updateAdminProfileDB, updatePasswordDB 
} from "./actions";

export default function SettingsPage() {
  // PERBAIKAN 1: Ambil 'status' dari useSession
  const { data: session, status } = useSession();
  
  // SOLUSI ERROR 1: Kita paksa TypeScript mengenali tipe datanya sebagai 'any' agar bisa membaca 'id'
  const userId = (session?.user as any)?.id;

  const [activeTab, setActiveTab] = useState<"SCHOOL" | "PROFILE" | "SECURITY">("SCHOOL");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // States: Sekolah
  const [schoolName, setSchoolName] = useState("");
  const [schoolLogo, setSchoolLogo] = useState("");
  
  // States: Admin Profile
  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminImage, setAdminImage] = useState("");

  // States: Keamanan
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPass, setShowPass] = useState(false);

  // PERBAIKAN 2: Pantau 'status', jika sudah tidak loading, paksa loadData berjalan
  useEffect(() => {
    if (status === "loading") return; // Tunggu sampai NextAuth selesai mengecek sesi
    loadData();
  }, [status, userId]);

  const loadData = async () => {
    setIsLoading(true);
    // PERBAIKAN 3: Jika userId kosong, kirim string kosong agar fungsi tidak error
    const res = await getSettingsDataDB((userId as string) || "belum_login");
    
    if (res?.success && res?.data) {
      setSchoolName(res.data.school?.schoolName || "LMS Pesantren");
      setSchoolLogo(res.data.school?.schoolLogo || "");
      
      // SOLUSI ERROR 2, 3, 4: Tambahkan tanda tanya (?.) dan nilai default ("") 
      // untuk berjaga-jaga jika admin bernilai null
      setAdminName(res.data.admin?.name || "");
      setAdminEmail(res.data.admin?.email || "");
      setAdminImage(res.data.admin?.image || "");
    }
    
    // PERBAIKAN 4: Pastikan loading selalu dimatikan pada akhirnya
    setIsLoading(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, setter: any) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setter(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSaveSchool = async () => {
    setIsSaving(true);
    const res = await updateSchoolDB({ schoolName, schoolLogo });
    setIsSaving(false);
    
    if (res.success) {
      alert("Data Sekolah berhasil diperbarui!");
      window.location.reload(); // <--- TAMBAHKAN BARIS INI
    } else {
      alert(res.error);
    }
  };

  const handleSaveProfile = async () => {
    if (!userId) return alert("Anda harus login dengan benar untuk mengubah profil!");
    setIsSaving(true);
    const res = await updateAdminProfileDB(userId as string, { name: adminName, email: adminEmail, image: adminImage });
    setIsSaving(false);
    
    if (res.success) {
      alert("Profil Admin berhasil diperbarui!");
      window.location.reload(); // <--- TAMBAHKAN BARIS INI JUGA
    } else {
      alert(res.error);
    }
  };

  const handleSavePassword = async () => {
    if (!userId) return alert("Anda harus login dengan benar untuk mengubah password!");
    if (newPassword.length < 6) return alert("Password baru minimal 6 karakter!");
    setIsSaving(true);
    const res = await updatePasswordDB(userId as string, oldPassword, newPassword);
    setIsSaving(false);
    if (res.success) {
      alert("Password berhasil diubah!");
      setOldPassword(""); setNewPassword("");
    } else {
      alert(res.error);
    }
  };

  // Jika status loading, tampilkan spinner
  if (isLoading || status === "loading") {
    return <div className="flex justify-center p-20"><Loader2 className="w-8 h-8 animate-spin text-emerald-600"/></div>;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-5xl mx-auto">
      <div>
        <h2 className="text-2xl font-black text-slate-800">Pengaturan Sistem</h2>
        <p className="text-sm text-slate-500 font-medium">Kelola identitas aplikasi, profil admin, dan keamanan akun Anda.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* NAVIGASI KIRI */}
        <div className="md:col-span-4 space-y-2">
          <button onClick={() => setActiveTab('SCHOOL')} className={`w-full text-left px-5 py-4 rounded-2xl font-bold flex items-center gap-3 transition-all ${activeTab === 'SCHOOL' ? 'bg-violet-600 text-white shadow-lg shadow-violet-200' : 'bg-white border border-slate-200 text-slate-600 hover:bg-violet-50'}`}><Building2 size={20}/> Identitas Sekolah</button>
          <button onClick={() => setActiveTab('PROFILE')} className={`w-full text-left px-5 py-4 rounded-2xl font-bold flex items-center gap-3 transition-all ${activeTab === 'PROFILE' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200' : 'bg-white border border-slate-200 text-slate-600 hover:bg-emerald-50'}`}><UserCircle size={20}/> Akun & Profil Admin</button>
          <button onClick={() => setActiveTab('SECURITY')} className={`w-full text-left px-5 py-4 rounded-2xl font-bold flex items-center gap-3 transition-all ${activeTab === 'SECURITY' ? 'bg-rose-600 text-white shadow-lg shadow-rose-200' : 'bg-white border border-slate-200 text-slate-600 hover:bg-rose-50'}`}><ShieldCheck size={20}/> Keamanan Akun</button>
        </div>

        {/* KONTEN KANAN */}
        <div className="md:col-span-8 bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden">
          
          {activeTab === 'SCHOOL' && (
            <div className="p-8 animate-in slide-in-from-right-4 duration-300">
              <h3 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2"><Building2 className="text-violet-600"/> Identitas Sekolah & Layout</h3>
              <div className="space-y-6">
                <div className="flex items-center gap-6">
                  <div className="w-24 h-24 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 flex items-center justify-center relative overflow-hidden group">
                    {schoolLogo ? <img src={schoolLogo} className="w-full h-full object-cover" alt="Logo"/> : <Building2 className="text-slate-300 w-10 h-10"/>}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                      <Camera className="text-white w-6 h-6"/>
                      <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, setSchoolLogo)} className="absolute inset-0 opacity-0 cursor-pointer"/>
                    </div>
                  </div>
                  <div><p className="font-bold text-slate-700">Logo Instansi</p><p className="text-xs text-slate-500">Klik area logo untuk mengunggah gambar baru. (JPG/PNG)</p></div>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-1.5">Nama Instansi / Sekolah</label>
                  <input type="text" value={schoolName} onChange={e => setSchoolName(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500 transition"/>
                </div>
                <div className="pt-4 border-t border-slate-100">
                  <button onClick={handleSaveSchool} disabled={isSaving} className="w-full bg-violet-600 text-white rounded-xl py-3.5 font-bold shadow-md hover:bg-violet-700 transition flex items-center justify-center gap-2 disabled:opacity-50"><Save size={18}/> {isSaving ? "Menyimpan..." : "Simpan Pengaturan Layout"}</button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'PROFILE' && (
            <div className="p-8 animate-in slide-in-from-right-4 duration-300">
              <h3 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2"><UserCircle className="text-emerald-600"/> Data Diri Admin</h3>
              <div className="space-y-6">
                <div className="flex items-center gap-6">
                  <div className="w-24 h-24 rounded-full border-4 border-slate-100 bg-slate-50 flex items-center justify-center relative overflow-hidden group">
                    {adminImage ? <img src={adminImage} className="w-full h-full object-cover" alt="Admin"/> : <UserCircle className="text-slate-300 w-12 h-12"/>}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                      <Camera className="text-white w-6 h-6"/>
                      <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, setAdminImage)} className="absolute inset-0 opacity-0 cursor-pointer"/>
                    </div>
                  </div>
                  <div><p className="font-bold text-slate-700">Foto Profil Pribadi</p><p className="text-xs text-slate-500">Tampil di sudut kanan atas seluruh halaman.</p></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-1.5">Nama Lengkap</label>
                    <input type="text" value={adminName} onChange={e => setAdminName(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"/>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-1.5">Alamat Email Login</label>
                    <input type="email" value={adminEmail} onChange={e => setAdminEmail(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"/>
                  </div>
                </div>
                <div className="pt-4 border-t border-slate-100">
                  <button onClick={handleSaveProfile} disabled={isSaving} className="w-full bg-emerald-600 text-white rounded-xl py-3.5 font-bold shadow-md hover:bg-emerald-700 transition flex items-center justify-center gap-2 disabled:opacity-50"><Save size={18}/> {isSaving ? "Menyimpan..." : "Simpan Profil Admin"}</button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'SECURITY' && (
            <div className="p-8 animate-in slide-in-from-right-4 duration-300">
              <h3 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2"><ShieldCheck className="text-rose-600"/> Keamanan Akun</h3>
              <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl mb-6 text-sm text-rose-800 font-medium">
                Gunakan kombinasi angka, huruf, dan simbol agar password tidak mudah ditebak. Jika Anda lupa password setelah mengubahnya, hubungi Super Admin.
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-1.5">Password Lama</label>
                  <div className="relative">
                    <input type={showPass ? "text" : "password"} value={oldPassword} onChange={e => setOldPassword(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-4 pr-12 py-3 font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500 transition" placeholder="Masukkan password saat ini"/>
                    <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"><Eye size={18}/></button>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-1.5">Password Baru</label>
                  <div className="relative">
                    <input type={showPass ? "text" : "password"} value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-4 pr-12 py-3 font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500 transition" placeholder="Buat password baru"/>
                    <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"><EyeOff size={18}/></button>
                  </div>
                </div>
                <div className="pt-6 border-t border-slate-100">
                  <button onClick={handleSavePassword} disabled={isSaving || !oldPassword || !newPassword} className="w-full bg-rose-600 text-white rounded-xl py-3.5 font-bold shadow-md hover:bg-rose-700 transition flex items-center justify-center gap-2 disabled:opacity-50"><ShieldCheck size={18}/> {isSaving ? "Memproses..." : "Perbarui Password"}</button>
                </div>
              </div>
            </div>
          )}
          
        </div>
      </div>
    </div>
  );
}