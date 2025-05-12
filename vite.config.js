import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import autoprefixer from 'autoprefixer'

export default defineConfig({
  plugins: [vue(), tailwindcss,autoprefixer,],
  resolve: {
    alias: {
      '@': '/src'  // @ 경로 별칭 설정
    }
  },
  // 필요한 경우 서버 설정
  server: {
    port: 3000,
    open: true
  }
})