import { AuthGuard } from "@/components/providers/auth-guard";
import { RouteAccessGuard } from "@/components/providers/route-access-guard";

export default function FlowLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AuthGuard>
      <RouteAccessGuard>
        <main className="h-screen w-full overflow-auto bg-background p-4">
          {children}
        </main>
      </RouteAccessGuard>
    </AuthGuard>
  );
}