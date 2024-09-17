import express from "express"
import { createServer } from "http"

import { handler } from "../build/handler.js"
import { setupSocketIoServer } from "../dist/examples/call/MeshCallServerDemo.js"

const port = 5173
const app = express()
const server = createServer(app)

setupSocketIoServer(server)

// SvelteKit should handle everything else using Express middleware
// https://github.com/sveltejs/kit/tree/master/packages/adapter-node#custom-server
app.use(handler)

server.listen(port)
