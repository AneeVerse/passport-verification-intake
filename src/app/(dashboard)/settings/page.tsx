import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import SettingsClientPage from "./SettingsClientPage";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user) return null;
  const userId = parseInt((session.user as any).id || "1");

  const [user, settings] = await Promise.all([
    prisma.user.findUnique({
      where: { user_id: userId },
    }),
    prisma.settings.findFirst({
      where: { settings_status: 1 },
    }),
  ]);

  return <SettingsClientPage initialUser={user as any} initialSettings={settings as any} />;
}
