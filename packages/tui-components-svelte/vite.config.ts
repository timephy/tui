import { sveltekit } from "@sveltejs/kit/vite"
import { type ViteDevServer, defineConfig } from "vite"

const webSocketServer = {
    name: "webSocketServer",
    async configureServer(server: ViteDevServer) {
        if (!server.httpServer) {
            console.log("WebSocket server is not running, because no HTTP server is available")
            return
        }

        const { setupSocketIoServer } = await import("./src/lib/examples/call/MeshCallServerDemo")
        setupSocketIoServer(server.httpServer)

        console.log("WebSocket server is running")
    },
}

export default defineConfig({
    plugins: [sveltekit(), webSocketServer],
})
