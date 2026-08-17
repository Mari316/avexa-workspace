import { AppDataProvider } from "../../context/AppDataContext";
import AppLayout from "../../components/layout/AppLayout";
import { getCurrentUser } from "../../server/auth/require-user";
import { redirect } from "next/navigation";

type WorkspaceLayoutProps = {
  children: React.ReactNode;
};

/**
 * Server-side session check so a forged/expired cookie that passed the optimistic
 * proxy cookie presence check still cannot render the workspace shell.
 * AppDataProvider only mounts here so /login does not fire unauthenticated API loads.
 */
export default async function WorkspaceLayout({
  children,
}: WorkspaceLayoutProps) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <AppDataProvider>
      <AppLayout>{children}</AppLayout>
    </AppDataProvider>
  );
}
