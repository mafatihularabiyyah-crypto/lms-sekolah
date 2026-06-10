// npm install --save-dev prisma dotenv
import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Ubah baris ini dari DATABASE_URL menjadi DIRECT_URL
    url: process.env["DIRECT_URL"], 
  },
});