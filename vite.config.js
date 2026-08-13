import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  // Plugin @tailwindcss/vite xử lý Tailwind CSS trực tiếp trong pipeline của Vite (khuyến nghị chính thức cho Tailwind v4).
  // PostCSS (postcss.config.js) vẫn được Vite tự động áp dụng thêm để chạy Autoprefixer cho các trình duyệt cũ.
  plugins: [react(), tailwindcss()],
})
