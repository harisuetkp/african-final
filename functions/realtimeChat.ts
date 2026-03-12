import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// WebSocket connection map
const connections = new Map();

Deno.serve(async (req) => {
  // Check if this is a WebSocket upgrade request
  if (req.headers.get("upgrade") === "websocket") {
    const { socket, response } = Deno.upgradeWebSocket(req);
    
    const base44 = createClientFromRequest(req);
    let userId = null;
    let matchId = null;

    socket.onopen = async () => {
      console.log("WebSocket connected");
    };

    socket.onmessage = async (event) => {
      try {
        const data = JSON.parse(event.data);

        // Handle authentication
        if (data.type === 'auth') {
          userId = data.userId;
          matchId = data.matchId;
          
          // Store connection
          if (!connections.has(matchId)) {
            connections.set(matchId, []);
          }
          connections.get(matchId).push({ userId, socket });

          // Send confirmation
          socket.send(JSON.stringify({ type: 'authenticated', matchId }));
        }

        // Handle typing indicator
        if (data.type === 'typing') {
          const matchConnections = connections.get(matchId) || [];
          matchConnections.forEach(conn => {
            if (conn.userId !== userId && conn.socket.readyState === WebSocket.OPEN) {
              conn.socket.send(JSON.stringify({
                type: 'user_typing',
                userId: data.userId,
                isTyping: data.isTyping
              }));
            }
          });
        }

        // Handle new message
        if (data.type === 'message') {
          // Broadcast to other user in match
          const matchConnections = connections.get(matchId) || [];
          matchConnections.forEach(conn => {
            if (conn.userId !== userId && conn.socket.readyState === WebSocket.OPEN) {
              conn.socket.send(JSON.stringify({
                type: 'new_message',
                message: data.message
              }));
            }
          });
        }

        // Handle read receipt
        if (data.type === 'read') {
          const matchConnections = connections.get(matchId) || [];
          matchConnections.forEach(conn => {
            if (conn.userId !== userId && conn.socket.readyState === WebSocket.OPEN) {
              conn.socket.send(JSON.stringify({
                type: 'message_read',
                messageId: data.messageId
              }));
            }
          });
        }

        // Handle ping (heartbeat)
        if (data.type === 'ping') {
          socket.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
        }

      } catch (error) {
        console.error('WebSocket message error:', error);
        socket.send(JSON.stringify({ type: 'error', message: 'Invalid message format' }));
      }
    };

    socket.onclose = () => {
      // Remove connection
      if (matchId && connections.has(matchId)) {
        const matchConnections = connections.get(matchId);
        const filtered = matchConnections.filter(conn => conn.socket !== socket);
        if (filtered.length === 0) {
          connections.delete(matchId);
        } else {
          connections.set(matchId, filtered);
        }
      }
      console.log("WebSocket disconnected");
    };

    socket.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    return response;
  }

  // Regular HTTP endpoint for polling fallback
  return Response.json({ error: 'WebSocket upgrade required' }, { status: 400 });
});