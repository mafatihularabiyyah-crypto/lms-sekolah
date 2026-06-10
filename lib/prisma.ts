import { PrismaClient } from '@prisma/client';
import { neonConfig } from '@neondatabase/serverless';
import { PrismaNeon } from '@prisma/adapter-neon';
import ws from 'ws';

// Mengatur WebSocket untuk Neon Serverless
neonConfig.webSocketConstructor = ws;

const prismaClientSingleton = () => {
  const connectionString = `${process.env.DATABASE_URL}`;
  
  // PENGUBAHAN: Langsung masukkan connectionString ke dalam PrismaNeon
  // (Kita melompati inisialisasi "new Pool()" bawaan Neon)
  const adapter = new PrismaNeon({ connectionString });
  
  return new PrismaClient({ adapter });
};

declare global {
  var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>;
}

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma;