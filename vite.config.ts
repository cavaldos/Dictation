import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import electron from 'vite-plugin-electron'
import renderer from 'vite-plugin-electron-renderer'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath } from "url";
import path from 'path';

const srcDir = fileURLToPath(new URL('./src', import.meta.url));

export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [['babel-plugin-react-compiler']],
      },
    }),
    tailwindcss(),

    electron([
      {
        entry: 'electron/main.ts',
      },
      {
        entry: 'electron/preload.ts',
        onstart(options) {
          options.reload()
        },
      },
    ]),
    renderer(),
  ],
  resolve: {
    alias: [
      // Use `~/` to import from the `src/` directory, e.g. `import X from '~/components/X'`
      { find: /^~\//, replacement: srcDir + '/' },
      // Also allow bare `~` -> `src`
      { find: '~', replacement: srcDir },
      // Semantic aliases for subdirectories
      { find: '@components', replacement: path.resolve(__dirname, 'src/components') },
      { find: '@pages', replacement: path.resolve(__dirname, 'src/pages') },
      { find: '@routes', replacement: path.resolve(__dirname, 'src/routes') },
      { find: '@types', replacement: path.resolve(__dirname, 'src/types') },
      { find: '@assets', replacement: path.resolve(__dirname, 'src/assets') },
    ],
  },
  clearScreen: false,
  server: {
    port: 5173,
  },
})
//
// import { defineConfig } from 'vite'
// import react from '@vitejs/plugin-react'
// import electron from 'vite-plugin-electron'
// import renderer from 'vite-plugin-electron-renderer'
// import tailwindcss from '@tailwindcss/vite'
// import { fileURLToPath } from "url";
// import path from 'path';

// const srcDir = fileURLToPath(new URL('./src', import.meta.url));

// export default defineConfig(({ command }) => {
//   const isBuild = command === 'build'

//   return {
//     plugins: [
//       react({
//         babel: {
//           plugins: [['babel-plugin-react-compiler']],
//         },
//       }),
//       tailwindcss(),

//       ...(isBuild ? [
//         electron([
//           {
//             entry: 'electron/main.ts',
//           },
//           {
//             entry: 'electron/preload.ts',
//             onstart(options) {
//               options.reload()
//             },
//           },
//         ]),
//         renderer(),
//       ] : []),
//     ],
//     resolve: {
//       alias: [
//         // Use `~/` to import from the `src/` directory, e.g. `import X from '~/components/X'`
//         { find: /^~\//, replacement: srcDir + '/' },
//         // Also allow bare `~` -> `src`
//         { find: '~', replacement: srcDir },
//         // Semantic aliases for subdirectories
//         { find: '@components', replacement: path.resolve(__dirname, 'src/components') },
//         { find: '@pages', replacement: path.resolve(__dirname, 'src/pages') },
//         { find: '@routes', replacement: path.resolve(__dirname, 'src/routes') },
//         { find: '@types', replacement: path.resolve(__dirname, 'src/types') },
//         { find: '@assets', replacement: path.resolve(__dirname, 'src/assets') },
//       ],
//     },
//     clearScreen: false,
//     server: {
//       port: 5173,
//     },
//   }
// })
