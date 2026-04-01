import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 2999,
        host: '0.0.0.0',
        proxy: {
          '/api': {
            target: 'http://localhost:3001',
            changeOrigin: true,
          }
        }
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.DATABASE_URL': JSON.stringify(env.DATABASE_URL),
        'process.env.EMAILJS_SERVICE_ID': JSON.stringify(env.EMAILJS_SERVICE_ID),
        'process.env.EMAILJS_TEMPLATE_ID': JSON.stringify(env.EMAILJS_TEMPLATE_ID),
        'process.env.EMAILJS_PUBLIC_KEY': JSON.stringify(env.EMAILJS_PUBLIC_KEY),
        'process.env.SMTP_HOST': JSON.stringify(env.SMTP_HOST),
        'process.env.SMTP_PORT': JSON.stringify(env.SMTP_PORT),
        'process.env.SMTP_USER': JSON.stringify(env.SMTP_USER),
        'process.env.SMTP_PASSWORD': JSON.stringify(env.SMTP_PASSWORD),
        'process.env.MAIL_FROM_ADDRESS': JSON.stringify(env.MAIL_FROM_ADDRESS),
        'process.env.MAIL_FROM_NAME': JSON.stringify(env.MAIL_FROM_NAME)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
