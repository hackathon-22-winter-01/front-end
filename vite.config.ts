import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import Pages from 'vite-plugin-pages'
import { VitePluginFonts } from 'vite-plugin-fonts'
import path from 'path'
import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin'

const srcPath = path.resolve(__dirname, 'src').replace(/\\/g, '/')

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    vanillaExtractPlugin(),
    Pages({
      extensions: ['tsx'],
      exclude: ['**/components/**/*'],
    }),
    VitePluginFonts({
      google: {
        families: ['Zen Maru Gothic'],
      },
    }),
  ],
  resolve: {
    alias: {
      '/@': srcPath,
    },
  },
})
