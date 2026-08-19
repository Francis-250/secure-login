import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { sendEmail } from "@/lib/brevo";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const USER_INCLUDE = {
  sender: { select: { id: true, name: true, email: true } },
  recipient: { select: { id: true, name: true, email: true } },
} as const;

async function requireUser() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return null;
  }
  return session;
}

export async function GET() {
  const session = await requireUser();
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const messages = await prisma.message.findMany({
    where: {
      OR: [{ senderId: session.user.id }, { recipientId: session.user.id }],
    },
    orderBy: { createdAt: "asc" },
    take: 200,
    include: USER_INCLUDE,
  });

  return Response.json(messages);
}

export async function POST(request: Request) {
  const session = await requireUser();
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as {
    message?: string;
  } | null;

  const messageBody =
    typeof body?.message === "string" ? body.message.trim() : "";

  if (!messageBody) {
    return Response.json({ error: "Message is required" }, { status: 400 });
  }

  const lastIncoming = await prisma.message.findFirst({
    where: {
      recipientId: session.user.id,
      sender: { role: "admin" },
    },
    orderBy: { createdAt: "desc" },
    include: { sender: { select: { id: true, name: true, email: true } } },
  });

  if (!lastIncoming) {
    return Response.json(
      { error: "You can only reply to a message sent by an admin." },
      { status: 400 },
    );
  }

  const admin = lastIncoming.sender;
  const subject = `Re: ${lastIncoming.subject}`;

  const message = await prisma.message
    .create({
      data: {
        senderId: session.user.id,
        recipientId: admin.id,
        subject,
        body: messageBody,
        status: "sending",
      },
      include: USER_INCLUDE,
    })
    .catch((error) => {
      console.error("Failed to save user reply:", error);
      return null;
    });

  if (!message) {
    return Response.json(
      { error: "Failed to save your message" },
      { status: 500 },
    );
  }

  const sent = await sendEmail({
    to: admin.email,
    subject,
    html: `<div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;color:#1e293b;line-height:1.6">
  <p style="margin:0 0 28px"><strong style="font-size:18px;color:#2563eb">SECURE LOGIN</strong></p>
  <p>Hi ${escapeHtml(admin.name ?? "Admin")},</p>
  <p style="color:#334155">${escapeHtml(messageBody)}</p>
  <p>Best regards,<br />${escapeHtml(session.user.name ?? session.user.email)}</p>
</div>`,
  });

  await prisma.message
    .update({
      where: { id: message.id },
      data: { status: sent ? "sent" : "failed" },
    })
    .catch(() => {});

  if (!sent) {
    return Response.json(
      { error: "Email delivery failed. Check the Brevo sender configuration." },
      { status: 500 },
    );
  }

  return Response.json(message, { status: 201 });
}