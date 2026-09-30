import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { authMiddleware } from "../middleware/auth.js";
import type { AuthRequest } from "../middleware/auth.js";

const router = Router();

router.use(authMiddleware);

async function getListIfAuthorized(listId: string, userId: string) {
  return prisma.list.findFirst({
    where: {
      id: listId,
      board: {
        OR: [
          { ownerId: userId },
          { members: { some: { userId } } },
        ],
      },
    },
  });
}

const createCardSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  priority: z.enum(["low", "medium", "high"]).optional(),
  listId: z.string().uuid(),
});

router.post("/", async (req: AuthRequest, res) => {
  if (!req.userId) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const parsed = createCardSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues });
  }

  const { title, description, priority, listId } = parsed.data;

  const list = await getListIfAuthorized(listId, req.userId);
  if (!list) {
    return res.status(404).json({ error: "List not found" });
  }

  const lastCard = await prisma.card.findFirst({
    where: { listId },
    orderBy: { position: "desc" },
  });

  const position = lastCard ? lastCard.position + 1 : 0;

  const card = await prisma.card.create({
    data: {
      title,
      description: description ?? null,
      priority: priority ?? "medium",
      listId,
      position,
    },
  });
   const io = req.app.get("io");
    io.to(`board:${list.boardId}`).emit("card:created", { card });
  res.status(201).json({ card });
});

const updateCardSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  priority: z.enum(["low", "medium", "high"]).optional(),
  listId: z.string().uuid().optional(),
  position: z.number().int().optional(),
});

const cardParamsSchema = z.object({
  id: z.string().uuid(),
});

router.patch("/:id", async (req: AuthRequest, res) => {
  if (!req.userId) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const parsedParams = cardParamsSchema.safeParse(req.params);
  if (!parsedParams.success) {
    return res.status(400).json({ error: "Invalid card ID" });
  }

  const parsedBody = updateCardSchema.safeParse(req.body);
  if (!parsedBody.success) {
    return res.status(400).json({ error: parsedBody.error.issues });
  }

  const { id } = parsedParams.data;

  const existingCard = await prisma.card.findUnique({ where: { id } });
  if (!existingCard) {
    return res.status(404).json({ error: "Card not found" });
  }

  const list = await getListIfAuthorized(existingCard.listId, req.userId);
  if (!list) {
    return res.status(404).json({ error: "Card not found" });
  }

    const updateData = Object.fromEntries(
    Object.entries(parsedBody.data).filter(([, value]) => value !== undefined)
  );

  const card = await prisma.card.update({
    where: { id },
    data: updateData,
  });

  res.json({ card });
});

router.delete("/:id", async (req: AuthRequest, res) => {
  if (!req.userId) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const parsedParams = cardParamsSchema.safeParse(req.params);
  if (!parsedParams.success) {
    return res.status(400).json({ error: "Invalid card ID" });
  }

  const { id } = parsedParams.data;

  const existingCard = await prisma.card.findUnique({ where: { id } });
  if (!existingCard) {
    return res.status(404).json({ error: "Card not found" });
  }

  const list = await getListIfAuthorized(existingCard.listId, req.userId);
  if (!list) {
    return res.status(404).json({ error: "Card not found" });
  }

  await prisma.card.delete({ where: { id } });

  res.status(204).send();
});

export default router;
