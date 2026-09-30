import "dotenv/config";
import express from "express";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import authRoutes from "./routes/auth.js";
import boardsRoutes from "./routes/boards.js";
import listsRoutes from "./routes/lists.js";
import cardsRoutes from "./routes/cards.js";
import { authMiddleware } from "./middleware/auth.js";
import type { AuthRequest } from "./middleware/auth.js";
import { prisma } from "./lib/prisma.js";

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: { origin: "https://devsprint-4wlz2rvdd-ayush-5864.vercel.app" },
});

io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    return next(new Error("No token provided"));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as jwt.JwtPayload;
    socket.data.userId = decoded.userId;
    next();
  } catch (err) {
    next(new Error("Invalid token"));
  }
});

io.on("connection", (socket) => {
  socket.on("join-board", (boardId: string) => {
    socket.join(`board:${boardId}`);
  });

  socket.on("leave-board", (boardId: string) => {
    socket.leave(`board:${boardId}`);
  });
});

app.set("io", io);

app.use(cors({ origin: "https://devsprint-4wlz2rvdd-ayush-5864.vercel.app" }));
app.use(express.json());

app.use("/auth", authRoutes);
app.use("/boards", boardsRoutes);
app.use("/lists", listsRoutes);
app.use("/cards", cardsRoutes);

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.get("/me", authMiddleware, async (req: AuthRequest, res) => {
  if (!req.userId) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const user = await prisma.user.findUnique({
    where: { id: req.userId },
    select: { id: true, email: true, name: true },
  });
  res.json({ user });
});

const PORT = process.env.PORT || 4000;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
