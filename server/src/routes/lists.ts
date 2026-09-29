import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { authMiddleware } from "../middleware/auth.js";
import type { AuthRequest } from "../middleware/auth.js";

const router = Router();

router.use(authMiddleware);

const createListSchema = z.object({
  title: z.string().min(1),
  boardId: z.string().uuid(),
});

router.post("/", async (req: AuthRequest, res) => {
  if (!req.userId) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const parsed = createListSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues });
  }

  const { title, boardId } = parsed.data;

  const board = await prisma.board.findFirst({
    where: {
      id: boardId,
      OR: [
        { ownerId: req.userId },
        { members: { some: { userId: req.userId } } },
      ],
    },
  });

  if (!board) {
    return res.status(404).json({ error: "Board not found" });
  }

  const lastList = await prisma.list.findFirst({
    where: { boardId },
    orderBy: { position: "desc" },
  });

  const position = lastList ? lastList.position + 1 : 0;

  const list = await prisma.list.create({
    data: { title, boardId, position },
  });

  res.status(201).json({ list });
});

const boardParamsSchema = z.object({
  boardId: z.string().uuid(),
});

router.get("/board/:boardId", async (req: AuthRequest, res) => {
  if (!req.userId) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const parsedParams = boardParamsSchema.safeParse(req.params);
  if (!parsedParams.success) {
    return res.status(400).json({ error: "Invalid board ID" });
  }

  const { boardId } = parsedParams.data;

  const board = await prisma.board.findFirst({
    where: {
      id: boardId,
      OR: [
        { ownerId: req.userId },
        { members: { some: { userId: req.userId } } },
      ],
    },
  });

  if (!board) {
    return res.status(404).json({ error: "Board not found" });
  }

  const lists = await prisma.list.findMany({
    where: { boardId },
    orderBy: { position: "asc" },
    include: { cards: { orderBy: { position: "asc" } } },
  });

  res.json({ lists });
});

export default router;
