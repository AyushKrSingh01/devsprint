import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { authMiddleware } from "../middleware/auth.js";
import type { AuthRequest } from "../middleware/auth.js";

const router = Router();

router.use(authMiddleware);

const createBoardSchema = z.object({
  title: z.string().min(1),
});

router.post("/", async (req: AuthRequest, res) => {
  if (!req.userId) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const parsed = createBoardSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues });
  }

  const board = await prisma.board.create({
    data: {
      title: parsed.data.title,
      ownerId: req.userId,
    },
  });

  res.status(201).json({ board });
});

router.get("/", async (req: AuthRequest, res) => {
  if (!req.userId) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const boards = await prisma.board.findMany({
    where: {
      OR: [
        { ownerId: req.userId },
        { members: { some: { userId: req.userId } } },
      ],
    },
    orderBy: { createdAt: "desc" },
  });

  res.json({ boards });
});

export default router;
