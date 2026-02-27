import { auth } from "@/auth";
import { prisma } from "./prisma";

export async function syncUser() {
  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  try {
    const dbUser = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    return dbUser;
  } catch (error) {
    console.error("Error fetching user:", error);
    return null;
  }
}
