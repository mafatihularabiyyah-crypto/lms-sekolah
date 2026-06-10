import "@/app/globals.css";
import { Providers } from "@/app/Providers";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function AkunLayout({ children }: { children: React.ReactNode }) {
  return (
    <Providers>
      {children}
    </Providers>
  );
}