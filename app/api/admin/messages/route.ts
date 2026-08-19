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

async function requireAdmin() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.role !== "admin") {
    return null;
  }
  return session;
}

export async function GET() {
  const session = await requireAdmin();
  if (!session) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const messages = await prisma.message.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: {
      sender: { select: { id: true, name: true, email: true } },
      recipient: { select: { id: true, name: true, email: true } },
    },
  });

  return Response.json(messages);
}

export async function POST(request: Request) {
  const session = await requireAdmin();
  if (!session) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as {
    recipientId?: string;
    subject?: string;
    message?: string;
  } | null;

  const recipientId =
    typeof body?.recipientId === "string" ? body.recipientId.trim() : "";
  const subject = typeof body?.subject === "string" ? body.subject.trim() : "";
  const messageBody =
    typeof body?.message === "string" ? body.message.trim() : "";

  if (!recipientId || !subject || !messageBody) {
    return Response.json(
      { error: "Recipient, subject and message are required" },
      { status: 400 },
    );
  }

  const recipient = await prisma.user.findUnique({
    where: { id: recipientId },
    select: { id: true, name: true, email: true },
  });

  if (!recipient) {
    return Response.json({ error: "Recipient not found" }, { status: 404 });
  }

  let message;
  try {
    message = await prisma.message.create({
      data: {
        senderId: session.user.id,
        recipientId,
        subject,
        body: messageBody,
        status: "sending",
      },
      include: {
        sender: { select: { id: true, name: true, email: true } },
        recipient: { select: { id: true, name: true, email: true } },
      },
    });
  } catch (error) {
    console.error("Failed to save message:", error);
    return Response.json(
      { error: "Failed to save the message record" },
      { status: 500 },
    );
  }

  const sent = await sendEmail({
    to: recipient.email,
    subject,
    html: `<div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;color:#1e293b;line-height:1.6">
  <p style="margin:0 0 28px"><strong style="font-size:18px;color:#2563eb">SECURE LOGIN</strong></p>
  <p>Hi ${escapeHtml(recipient.name ?? "there")},</p>
  <p style="color:#334155">${escapeHtml(messageBody)}</p>
  <p>Best regards,<br />The SECURE LOGIN security team</p>
</div>`,
  });

  const updated = await prisma.message
    .update({
      where: { id: message.id },
      data: { status: sent ? "sent" : "failed" },
      include: {
        sender: { select: { id: true, name: true, email: true } },
        recipient: { select: { id: true, name: true, email: true } },
      },
    })
    .catch(() => message);

  if (!sent) {
    return Response.json(
      { error: "Email delivery failed. Check the Brevo sender configuration." },
      { status: 500 },
    );
  }

  return Response.json(updated, { status: 201 });
}
