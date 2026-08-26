import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { getOrCreateConversation } from "@/lib/social";

export const dynamic = "force-dynamic";

export default async function NewMessagePage({
  searchParams,
}: {
  searchParams: Promise<{ to?: string }>;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const { to } = await searchParams;
  if (!to) redirect("/messages");
  const conversation = await getOrCreateConversation(user.id, to);
  redirect(`/messages/${conversation.id}`);
}
