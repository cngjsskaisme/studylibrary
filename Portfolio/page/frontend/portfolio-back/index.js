import { serve } from 'bun'
import promptRAGClient from './tools/getRAGClient';

const wsServer = serve({
  port: 8080, // Adjust port as needed

  // HTTP handler to respond to non-WebSocket HTTP requests
  fetch(req, server) {
    const { pathname } = new URL(req.url);

    // Check if the request is a WebSocket upgrade and matches the correct path
    console.log(pathname)
    if (req.headers.get("upgrade") === "websocket" && pathname === "/api/v1/chat") {
      // Return a WebSocket upgrade response with status 101
      return server.upgrade(req); // Perform WebSocket upgrade
    }

    // Reject non-WebSocket or incorrect path requests
    return new Response("This server only accepts WebSocket connections on /api/v1/chat", {
      status: 400,
    });
  },

  websocket: {
    open(ws) {
      console.log("WebSocket connection established on /api/v1/chat");
    },
    message(ws, message) {
      const targetPrompt = message.toString(); // Convert message to string
      promptRAGClient(targetPrompt, (response, isDone) => {
        ws.send(JSON.stringify({
          r: response,
          d: isDone
        })); // Send each response part to the client
      }).catch((error) => {
        ws.send(`Error: ${error.message}`); // Send error message if any
      });
    },
    close(ws) {
      console.log("WebSocket connection closed");
    }
  }
});

console.log("WebSocket server running on ws://localhost:8080/api/v1/chat");