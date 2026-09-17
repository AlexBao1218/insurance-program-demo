import { Outlet } from "react-router-dom";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import AppSidebar from "@/components/AppSidebar";
import Header from "@/components/Header";
import DemoFooter from "@/components/DemoFooter";

export function Layout() {
  return (
    <SidebarProvider style={{ "--sidebar-width": "18rem" } as React.CSSProperties}>
      <AppSidebar />
      <SidebarInset className="flex flex-col min-w-0 overflow-x-hidden">
        <Header />
        <main className="flex-1 w-full overflow-y-auto px-4 md:px-6 lg:px-8 py-6">
          <Outlet />
        </main>
        <DemoFooter />
      </SidebarInset>
    </SidebarProvider>
  );
}
