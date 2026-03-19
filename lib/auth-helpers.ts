import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function requireAdmin() {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    throw new Error("Unauthorized");
  }
  return session;
}

export async function requireAuth() {
  const session = await auth();
  if (!session) {
    throw new Error("Unauthorized");
  }
  return session;
}

/**
 * Checks if the current user can access data for the given clientId.
 * Admin can access any client; client role can only access their own.
 */
export async function canAccessClient(clientId: string): Promise<boolean> {
  const session = await auth();
  if (!session) return false;
  if (session.user.role === "admin") return true;

  const client = await prisma.client.findUnique({
    where: { id: clientId },
    select: { userId: true },
  });
  return client?.userId === session.user.id;
}

export async function getClientForUser(userId: string) {
  return prisma.client.findUnique({ where: { userId } });
}
