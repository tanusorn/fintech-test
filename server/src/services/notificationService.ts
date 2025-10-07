import { prisma } from "../config/prisma.js";
export const notify = (userId: number | null, message: string) =>
  prisma.notification.create({
    data: { userId: userId ?? null, message },
  });
