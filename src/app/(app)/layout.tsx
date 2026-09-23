import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Sidebar } from "@/components/sidebar";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-gastus-light-bg dark:bg-gastus-bg">
      <Sidebar />
      <main className="md:ml-64 p-4 pt-16 md:pt-6 md:p-6">{children}</main>
    </div>
  );
}
