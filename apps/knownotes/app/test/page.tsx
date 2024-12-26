import { db } from "@/lib/db";
import { PrismaAdapter } from "@auth/prisma-adapter";

export default async function Test() {
  const adapter = PrismaAdapter(db);

  if (adapter.createUser) {
    const user = await adapter.createUser({
      email: "theo@knownotes.ai",
      name: "Theo",
    });
  } else {
    console.error("createUser is undefined");
  }
  return <></>;
}
