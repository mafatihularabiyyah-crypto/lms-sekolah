"use client";

import React, { useState, useEffect } from "react";
import { 
  UserCircle, Lock, Mail, Phone, MapPin, 
  KeySquare, Camera, Save, CheckCircle2, 
  ShieldCheck, User, Loader2
} from "lucide-react";
import { getProfilSantriDB, updateProfilSantriDB, updatePasswordSantriDB } from "./actions";

export default function PengaturanProfilSantri() {
  const [profileData, setProfileData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // State Form Editable
  const [teleponWali, setTeleponWali] = useState("");
  const [alamat, setAlamat] = useState("");
  const [avatarBase64, setAvatarBase64] = useState(""); // Untuk menyimpan foto baru

  // State Keamanan
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // State Status Loading
  const [isSavingProfil, setIsSavingProfil] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  // Load Data Saat Halaman Dibuka
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    const res = await getProfilSantriDB();
    if (res.success && res.data) {
      setProfileData(res.data);
      setTeleponWali(res.data.teleponWali);
      setAlamat(res.data.alamat);
      setAvatarBase64(res.data.image);
    }
    setIsLoading(false);
  };

  // Kompresi Foto Profil (Otomatis Max 300px)
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const MAX_SIZE = 300;
        let width = img.width; let height = img.height;

        if (width > height && width > MAX_SIZE) {
          height *= MAX_SIZE / width;
          width = MAX_SIZE;
        } else if (height > MAX_SIZE) {
          width *= MAX_SIZE / height;
          height = MAX_SIZE;
        }
        canvas.width = width; canvas.height = height;
        ctx?.drawImage(img, 0, 0, width, height);
        
        // Update tampilan Avatar seketika
        setAvatarBase64(canvas.toDataURL("image/jpeg", 0.8));
      };
    };
  };

  const handleUpdateProfil = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfil(true);
    
    const res = await updateProfilSantriDB({
      teleponWali,
      alamat,
      image: avatarBase64 !== profileData.image ? avatarBase64 : undefined
    });

    setIsSavingProfil(false);
    if (res.success) {
      alert("Alhamdulillah, perubahan biodata dan foto berhasil disimpan!");
      loadData();
    } else {
      alert(res.error || "Gagal menyimpan biodata.");
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      alert("Konfirmasi kata sandi baru tidak cocok. Silakan periksa kembali.");
      return;
    }
    
    setIsSavingPassword(true);
    const res = await updatePasswordSantriDB(currentPassword, newPassword);
    setIsSavingPassword(false);

    if (res.success) {
      alert("Kata sandi berhasil diperbarui. Gunakan kata sandi baru Anda pada login berikutnya.");
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
    } else {
      alert(res.error || "Gagal memperbarui kata sandi.");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <Loader2 size={48} className="animate-spin text-indigo-600 mb-4" />
        <p className="text-slate-500 font-bold animate-pulse">Memuat profil santri...</p>
      </div>
    );
  }

  if (!profileData) return null;

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-700 font-sans pb-12">
      
      {/* 1. HERO HEADER: USER PROFILE PROFILE */}
      <div className="bg-white rounded-[2.5rem] p-8 md:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 relative overflow-hidden flex flex-col sm:flex-row items-center gap-6">
        <div className="absolute top-0 right-0 w-80 h-80 bg-slate-50 rounded-full -translate-y-1/2 translate-x-1/3 pointer-events-none z-0"></div>
        
        {/* Avatar Area dengan Upload Foto */}
        <div className="relative group z-10 shrink-0">
          <div className="w-24 h-24 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-[2rem] flex items-center justify-center text-white font-black text-3xl shadow-xl shadow-indigo-500/10 border-4 border-white overflow-hidden">
            {avatarBase64 ? (
              <img src={avatarBase64} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              profileData.nama.substring(0, 1).toUpperCase()
            )}
          </div>
          <label className="absolute bottom-0 right-0 w-8 h-8 bg-slate-900 text-white rounded-xl flex items-center justify-center border-2 border-white shadow hover:scale-110 transition-transform cursor-pointer" title="Ubah Foto">
            <Camera size={14} />
            <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
          </label>
        </div>

        {/* Informasi Ringkas */}
        <div className="relative z-10 text-center sm:text-left space-y-1.5 flex-1">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">{profileData.nama}</h1>
            <span className="bg-emerald-50 text-emerald-600 text-[10px] font-black px-2.5 py-0.5 rounded-full border border-emerald-100">
              {profileData.status}
            </span>
          </div>
          <p className="text-sm font-medium text-slate-500">Santri Angkatan {profileData.angkatan} &bull; NIS {profileData.nis}</p>
        </div>
      </div>

      {/* 2. SPLIT LAYOUT FORM */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* KOLOM KIRI (Span 2): BIODATA LENGKAP */}
        <div className="xl:col-span-2 bg-white rounded-[2.5rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
              <UserCircle className="text-indigo-600" size={24} />
              <div>
                <h3 className="text-lg font-black text-slate-800">Biodata & Informasi Akademik</h3>
                <p className="text-xs text-slate-400 font-medium">Data resmi kedinasan pesantren. Kolom abu-abu hanya bisa diubah oleh Admin.</p>
              </div>
            </div>

            <form onSubmit={handleUpdateProfil} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* NIS & JK (Disabled) */}
                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Nomor Induk Santri (NIS)</label>
                  <input type="text" value={profileData.nis} disabled className="w-full px-4 py-3 bg-slate-50 border border-slate-200 text-slate-400 rounded-xl font-bold text-sm cursor-not-allowed"/>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Jenis Kelamin</label>
                  <input type="text" value={profileData.jk} disabled className="w-full px-4 py-3 bg-slate-50 border border-slate-200 text-slate-400 rounded-xl font-bold text-sm cursor-not-allowed"/>
                </div>

                {/* Nama Lengkap & Email (Disabled) */}
                <div className="sm:col-span-2">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Nama Lengkap</label>
                  <div className="relative">
                     <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                     <input type="text" value={profileData.nama} disabled className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 text-slate-400 rounded-xl font-bold text-sm cursor-not-allowed"/>
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Alamat Email Aktif</label>
                  <div className="relative">
                     <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                     <input type="email" value={profileData.email} disabled className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 text-slate-400 rounded-xl font-bold text-sm cursor-not-allowed" title="Hubungi Admin untuk ubah email"/>
                  </div>
                </div>

                {/* Nama Wali (Disabled) & WA Wali (Editable) */}
                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Nama Orang Tua / Wali</label>
                  <input type="text" value={profileData.wali} disabled className="w-full px-4 py-3 bg-slate-50 border border-slate-200 text-slate-400 rounded-xl font-bold text-sm cursor-not-allowed"/>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">No. WhatsApp Wali (Dapat Diubah)</label>
                  <div className="relative">
                     <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                     <input type="text" value={teleponWali} onChange={e => setTeleponWali(e.target.value)} className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 text-slate-800 rounded-xl font-bold text-sm focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 transition-all" required/>
                  </div>
                </div>

                {/* Alamat Rumah (Editable) */}
                <div className="sm:col-span-2">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">Alamat Domisili Asal (Dapat Diubah)</label>
                  <div className="relative">
                     <MapPin className="absolute left-4 top-3 w-4 h-4 text-slate-400" />
                     <textarea rows={3} value={alamat} onChange={e => setAlamat(e.target.value)} className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 text-slate-800 rounded-xl font-bold text-sm focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 transition-all resize-none" required></textarea>
                  </div>
                </div>

              </div>

              {/* Tombol Simpan Profil */}
              <div className="pt-4 flex justify-end">
                <button type="submit" disabled={isSavingProfil} className="flex items-center gap-2 px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black shadow-lg shadow-slate-900/10 transition-all cursor-pointer disabled:opacity-50">
                  {isSavingProfil ? <Loader2 size={14} className="animate-spin" /> : <Save size={14}/>} 
                  {isSavingProfil ? "Menyimpan..." : "Simpan Pembaruan"}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* KOLOM KANAN (Span 1): KEAMANAN & GANTI PASSWORD */}
        <div className="bg-white rounded-[2.5rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex flex-col h-full">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
            <KeySquare className="text-indigo-600" size={24} />
            <div>
              <h3 className="text-lg font-black text-slate-800">Keamanan Akun</h3>
              <p className="text-xs text-slate-400 font-medium">Perbarui kata sandi berkala.</p>
            </div>
          </div>

          <form onSubmit={handleUpdatePassword} className="space-y-4 flex-1 flex flex-col">
            
            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">Kata Sandi Sekarang</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="password" placeholder="••••••••" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 text-slate-800 rounded-xl font-medium text-sm focus:outline-none focus:border-indigo-500 transition-all" required/>
              </div>
            </div>

            <div className="w-full h-px bg-slate-100 my-2"></div>

            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">Kata Sandi Baru</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="password" placeholder="Minimal 6 karakter" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 text-slate-800 rounded-xl font-medium text-sm focus:outline-none focus:border-indigo-500 transition-all" required minLength={6}/>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">Konfirmasi Kata Sandi Baru</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="password" placeholder="Ulangi kata sandi baru" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 text-slate-800 rounded-xl font-medium text-sm focus:outline-none focus:border-indigo-500 transition-all" required minLength={6}/>
              </div>
            </div>

            <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100 flex items-start gap-3 mt-auto pt-4">
              <ShieldCheck size={18} className="text-indigo-600 shrink-0 mt-0.5" />
              <p className="text-[11px] font-bold text-indigo-800 leading-relaxed uppercase tracking-wide">
                Setelah password diganti, pastikan Anda mencatatnya dengan baik agar tidak kehilangan akses masuk portal.
              </p>
            </div>

            <button type="submit" disabled={isSavingPassword || !currentPassword || !newPassword} className="w-full flex items-center justify-center gap-2 px-5 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black shadow-lg shadow-indigo-200 transition-all cursor-pointer disabled:opacity-50 mt-4">
              {isSavingPassword ? <Loader2 size={14} className="animate-spin" /> : <Lock size={14}/>}
              {isSavingPassword ? "Memperbarui..." : "Perbarui Kata Sandi"}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}