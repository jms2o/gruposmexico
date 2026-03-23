import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import Index from "./pages/Index";
import GroupDetail from "./pages/GroupDetail";
import CategoryPage from "./pages/CategoryPage";
import AllGroupsPage from "./pages/AllGroupsPage";
import SoundPackagesPage from "./pages/SoundPackagesPage";
import AdminPanel from "./pages/AdminPanel";
import AuthPage from "./pages/AuthPage";
import GroupRegister from "./pages/GroupRegister";
import MembershipSelect from "./pages/MembershipSelect";
import GroupDashboard from "./pages/GroupDashboard";
import CityPage from "./pages/CityPage";
import ReelsPage from "./pages/ReelsPage";
import InboxPage from "./pages/InboxPage";
import PublishPage from "./pages/PublishPage";
import EventRequestPage from "./pages/EventRequestPage";
import ClientInboxPage from "./pages/ClientInboxPage";
import ClientDashboard from "./pages/ClientDashboard";
import NotFound from "./pages/NotFound";
import BottomNav from "./components/BottomNav";

const queryClient = new QueryClient();
const routerBasename =
  import.meta.env.BASE_URL === "/"
    ? undefined
    : import.meta.env.BASE_URL.replace(/\/$/, "");

function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider delayDuration={0}>
          <Toaster />
          <Sonner />
          <BrowserRouter basename={routerBasename}>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/categoria/:id" element={<CategoryPage />} />
              <Route path="/todos-los-grupos" element={<AllGroupsPage />} />
              <Route path="/paquetes" element={<SoundPackagesPage />} />
              <Route path="/grupo/:id" element={<GroupDetail />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/registrar-grupo" element={<GroupRegister />} />
              <Route path="/membresias" element={<MembershipSelect />} />
              <Route path="/mi-panel" element={<GroupDashboard />} />
              <Route path="/mi-cuenta" element={<ClientDashboard />} />
              <Route path="/admin" element={<AdminPanel />} />
              <Route path="/reels" element={<ReelsPage />} />
              <Route path="/bandeja" element={<InboxPage />} />
              <Route path="/publicar" element={<PublishPage />} />
              <Route path="/solicitar-evento" element={<EventRequestPage />} />
              <Route path="/mis-solicitudes" element={<ClientInboxPage />} />
              <Route path="/:ciudad" element={<CityPage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
            <BottomNav />
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
