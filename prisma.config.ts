import 'dotenv/config';
import { defineConfig, env } from '@prisma/config';

export default defineConfig({
  datasource: {
    // Gunakan fungsi env() bawaan Prisma 7
    url: env('DATABASE_URL'), 
  },
});