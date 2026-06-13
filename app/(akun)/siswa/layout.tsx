import Link from "next/link";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { Bell } from "lucide-react";
import { ClientNavList, ClientGreeting, ClientUserMenu } from "./ClientComponents";

export const dynamic = "force-dynamic";

export default async function SantriLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession();
  const userName = session?.user?.name || "Santri";
  const userInitial = userName.charAt(0).toUpperCase();

  let schoolName = "LMS Pesantren";
  let schoolLogo = "";
  let userImage = ""; 

  if (session?.user?.email) {
    const userDb = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { tenantId: true, image: true } 
    });

    if (userDb) {
      userImage = userDb.image || ""; 
      
      if (userDb.tenantId) {
        const settings = await prisma.systemSettings.findUnique({
          where: { tenantId: userDb.tenantId },
          select: { schoolName: true, schoolLogo: true }
        });
        
        if (settings) {
          schoolName = settings.schoolName || "LMS Pesantren";
          schoolLogo = settings.schoolLogo || "";
        }
      }
    }
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex font-sans overflow-hidden">
      
      {/* SIDEBAR */}
      <aside className="w-[280px] bg-gradient-to-br from-blue-500 to-indigo-600 border-r border-blue-400/30 hidden lg:flex flex-col z-20 h-screen shadow-[4px_0_24px_rgba(0,0,0,0.05)] relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-64 bg-white/10 blur-[80px] pointer-events-none"></div>
        <div className="pt-10 pb-8 flex flex-col items-center justify-center border-b border-white/10 mx-6 relative z-10">
          <div className="w-22 h-22 bg-white rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.15)] flex items-center justify-center mb-5 overflow-hidden p-2">
            {schoolLogo ? (
              <img src={schoolLogo} alt="Logo Sekolah" className="w-full h-full object-contain" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-blue-50 text-blue-600 rounded-xl font-black text-4xl">{schoolName.charAt(0)}</div>
            )}
          </div>
          <h1 className="font-black text-white text-[17px] leading-tight text-center tracking-tight px-2 drop-shadow-sm">{schoolName}</h1>
          <p className="text-[9px] font-black text-blue-100 uppercase tracking-[0.25em] mt-2">Portal Santri</p>
        </div>
        <div className="flex-1 py-8 px-5 space-y-1.5 overflow-y-auto custom-scrollbar relative z-10">
          <p className="px-4 text-[10px] font-bold text-blue-100/70 uppercase tracking-widest mb-5">Menu Utama</p>
          <ClientNavList />
        </div>
        <div className="p-6 border-t border-white/10 bg-black/5 relative z-10">
          <ClientGreeting action="logout" />
        </div>
      </aside>

      {/* KONTEN UTAMA */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden bg-[#F8FAFC]">
        <header className="h-24 bg-white/70 backdrop-blur-xl border-b border-slate-200/40 z-10 flex items-center justify-between px-8 lg:px-12 sticky top-0">
            <div className="hidden md:block animate-in fade-in slide-in-from-left-4 duration-700">
              <ClientGreeting action="greet" userName={userName.split(" ")[0]} />
            </div>

            <div className="flex items-center gap-6 cursor-pointer group ml-auto md:ml-0">
               {/* Kode Profil Lama Dihapus, 
                 Digantikan dengan ClientUserMenu yang Interaktif! 
               */}
               <ClientUserMenu 
                 userName={userName} 
                 userInitial={userInitial} 
                 userImage={userImage} 
               />
            </div>
        </header>

        <div className="flex-1 overflow-y-auto">
          <div className="p-6 md:p-8 lg:p-12">
            {children}
          </div>
        </div>
      </main>

    </div>
  );
}