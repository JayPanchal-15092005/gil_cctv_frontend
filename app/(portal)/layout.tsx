import { ReactNode } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import PortalShell from "@/components/portal/PortalShell";
import { AUTH_COOKIE_NAME } from "@/lib/auth";

export default async function PortalLayout({ children }: { children: ReactNode }) {
  const cookieStore = await cookies();
  const isAuthenticated = cookieStore.get(AUTH_COOKIE_NAME)?.value === "1";

  if (!isAuthenticated) {
    redirect("/login");
  }

  return <PortalShell>{children}</PortalShell>;
}
