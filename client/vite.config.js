import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'


export default defineConfig({
  plugins: [react()],
  build: {
    outDir: '../server/static', // Ensure this path aligns with Flask's static folder
    emptyOutDir: true,           // Clears the output directory before each build
  },
});



// https://vitejs.dev/config/
//export default defineConfig({
  //plugins: [react()],
  //server: {
   //proxy: {
    //'/api': {
      //target: 'http://localhost:5555',
      //changeOrigin: true,
      //rewrite: (path) => path.replace(/^\/api/, ''),
    //},
   //},
 //}
//})
