// Mengimpor fungsi utama dari library next-auth untuk mengatur autentikasi
import NextAuth from "next-auth";

// Mengimpor file konfigurasi autentikasi yang berisi provider, callbacks, dll
import { authConfig } from "./auth.config";

// Menjalankan NextAuth dengan konfigurasi yang diimpor
// Lalu mengekstrak tiga fungsi utama:
// - auth: untuk mengambil data user login dari sisi server (SSR/server action)
// - signIn: untuk memicu login secara manual dari client
// - signOut: untuk memicu logout secara manual dari client
export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig, // Menyebarkan isi konfigurasi autentikasi ke dalam fungsi NextAuth
});
