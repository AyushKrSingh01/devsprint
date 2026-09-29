import "dotenv/config";
import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.js";
import { authMiddleware } from "./middleware/auth.js";
import type { AuthRequest } from "./middleware/auth.js";
import { prisma } from "./lib/prisma.js";
import boardsRoutes from "./routes/boards.js";
import listsRoutes from "./routes/lists.js";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/auth", authRoutes);
app.use("/boards", boardsRoutes);
app.use("/lists", listsRoutes);

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
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
