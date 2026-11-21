import AppSidebar from "@/components/layout/app-sidebar";
import AppHeader from "@/components/layout/app-header";
import AiAnalysisWidget from "@/components/ai-chat/ai-analysis-widget";
import { AuthGuard } from "@/components/providers/auth-guard";
import { RouteAccessGuard } from "@/components/providers/route-access-guard";

export default function AppRootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AuthGuard>
      <div className="flex h-screen w-full overflow-hidden">
        <AppSidebar />
        <div className="flex min-w-0 flex-1 flex-col bg-sidebar">
          <AppHeader />
          <main className="flex-1 overflow-y-auto p-6 border rounded-bl-lg rounded-br-lg border-t-0 transform-gpu">
            <RouteAccessGuard>{children}</RouteAccessGuard>
          </main>
        </div>
        <AiAnalysisWidget />
      </div>
    </AuthGuard>
  );
}
