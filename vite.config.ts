// vite.config.js
export default {
    // config options
    server: {
        fs: {
          // Allow serving files outside of the root
          allow: [
            "../.."
          ]
        }
      },
    optimizeDeps: { exclude: ["@babylonjs/havok"] }
}
