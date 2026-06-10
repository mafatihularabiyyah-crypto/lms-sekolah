import Sidebar from "@/app/components/Sidebar"; 
import Navbar from "@/app/components/Navbar"; 

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex font-sans text-slate-800">
      
      {/* Sidebar dipanggil dari komponen luar */}
      <Sidebar />

      <main className="flex-1 flex flex-col min-w-0 md:ml-[280px]">
        
        {/* Navbar dipanggil dari komponen luar */}
        <Navbar />
        
        <div className="p-6 lg:p-8 flex-1 overflow-auto">
          {children}
        </div>
      </main>
    </div>
  );
}