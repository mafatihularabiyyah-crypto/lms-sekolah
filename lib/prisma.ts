import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

// Mengamankan tipe data global untuk TypeScript
declare global {
  var globalPrisma: PrismaClient | undefined;
  var globalPgPool: Pool | undefined;
}

const connectionString = `${process.env.DATABASE_URL}`;

// 1. Pastikan Pool PostgreSQL hanya dibuat SATU KALI di memory global (Mencegah Kebocoran)
if (!globalThis.globalPgPool) {
  globalThis.globalPgPool = new Pool({ 
    connectionString,
    max: 10, // Batasi maksimal 10 koneksi per instance
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });
}

// 2. Pasang adapter Prisma menggunakan pool global yang aman
const adapter = new PrismaPg(globalThis.globalPgPool);

// 3. Inisialisasi Prisma Client secara aman
const prisma = globalThis.globalPrisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== 'production') {
  globalThis.globalPrisma = prisma;
}

export default prisma;