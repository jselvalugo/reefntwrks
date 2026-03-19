import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import bcrypt from "bcryptjs";

function validatePassword(password: string): string | null {
  if (password.length < 8) return "Password must be at least 8 characters.";
  if (!/[A-Z]/.test(password)) return "Password must contain at least one uppercase letter.";
  if (!/[0-9]/.test(password)) return "Password must contain at least one number.";
  return null;
}

// PUT /api/v1/user/profile
export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { name, email, currentPassword, newPassword, confirmPassword, preferences } = body;

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const updates: Record<string, unknown> = {};

  // Update name
  if (name !== undefined) updates.name = name;

  // Update preferences (client only)
  if (preferences !== undefined) updates.preferences = preferences;

  // Email or password change requires current password
  if (email || newPassword) {
    if (!currentPassword)
      return NextResponse.json({ error: "Current password is required" }, { status: 400 });

    if (!user.passwordHash)
      return NextResponse.json({ error: "Cannot change password for OAuth accounts" }, { status: 400 });

    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid)
      return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });

    if (email) updates.email = email;

    if (newPassword) {
      if (newPassword !== confirmPassword)
        return NextResponse.json({ error: "Passwords do not match" }, { status: 400 });

      const validationError = validatePassword(newPassword);
      if (validationError)
        return NextResponse.json({ error: validationError }, { status: 400 });

      updates.passwordHash = await bcrypt.hash(newPassword, 12);

      // Invalidate all sessions
      await prisma.session.deleteMany({ where: { userId: user.id } });
    }
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: updates,
    select: { id: true, name: true, email: true, role: true },
  });

  return NextResponse.json(updated);
}
