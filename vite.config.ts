import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// sourcemap is off so no source maps are shipped to customers.
export default defineConfig({ plugins: [react()], build: { sourcemap: false } });
