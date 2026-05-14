import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 5174,
        strictPort: true,
        host: '0.0.0.0',
        hmr: {
          clientPort: 5174,
          host: 'localhost'
        },
        proxy: {
          '/api': {
            target: 'http://127.0.0.1:3002',
            changeOrigin: true,
            secure: false,
          }
        }
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.VITE_GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.VITE_GEMINI_API_KEY),
        'process.env.DATABASE_URL': JSON.stringify(env.DATABASE_URL),
        'process.env.EMAILJS_SERVICE_ID': JSON.stringify(env.VITE_EMAILJS_SERVICE_ID),
        'process.env.EMAILJS_TEMPLATE_ID': JSON.stringify(env.VITE_EMAILJS_TEMPLATE_ID),
        'process.env.EMAILJS_PUBLIC_KEY': JSON.stringify(env.VITE_EMAILJS_PUBLIC_KEY),
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
