import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { existsSync, readFileSync } from 'node:fs';

// HTTPS for local dev/preview using the certificate made by scripts/generate-cert.js (mkcert).
const keyPath = '.cert/key.pem';
const certPath = '.cert/cert.pem';
const https = existsSync(keyPath) && existsSync(certPath) ? { key: readFileSync(keyPath), cert: readFileSync(certPath) } : undefined;

// base: './' lets the build run from any sub-folder (e.g. /sikhri-donation-form/).
export default defineConfig({
  plugins: [react()],
  base: './',
  // Local dev uses the deployed Vercel API (override with API_PROXY=https://...).
  server: { https, host: true, port: 5173, proxy: { '/api': { target: process.env.API_PROXY || 'https://sikhri-donation-form.vercel.app', changeOrigin: true, secure: true } } },
  preview: { https, host: true, port: 4173 },
});
