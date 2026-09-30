import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    const token = localStorage.getItem("token");
    socket = io(process.env.NEXT_PUBLIC_API_URL, {
      auth: { token },
    });
  }
  return socket;
}
