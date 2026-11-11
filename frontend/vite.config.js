import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// O frontend e o backend leem o mesmo arquivo .env, na raiz do projeto.
export default defineConfig({ envDir: '..', plugins: [react()] });
