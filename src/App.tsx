import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import { VerticalProvider } from "@/contexts/VerticalContext";
import { LocaleProvider } from "@/contexts/LocaleContext";
import VerticalThemeWrapper from "@/components/VerticalThemeWrapper";
import Homepage from "./pages/Homepage.tsx";
import Index from "./pages/Index.tsx";
import Login from "./pages/Login.tsx";
import ProductDetail from "./pages/ProductDetail.tsx";
import Messages from "./pages/Messages.tsx";
import Sell from "./pages/Sell.tsx";
import Profile from "./pages/Profile.tsx";
import SearchResults from "./pages/SearchResults.tsx";
import NotFound from "./pages/NotFound.tsx";
import Admin from "./pages/Admin.tsx";
import Orders from "./pages/Orders.tsx";
import Install from "./pages/Install.tsx";
import Analytics from "./pages/Analytics.tsx";
import Insights from "./pages/Insights.tsx";
import Pricing from "./pages/Pricing.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <LocaleProvider>
          <VerticalProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <VerticalThemeWrapper>
                <Routes>
                  <Route path="/" element={<Homepage />} />
                  <Route path="/index" element={<Homepage />} />
                  <Route path="/browse" element={<Index />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/product/:id" element={<ProductDetail />} />
                  <Route path="/messages" element={<Messages />} />
                  <Route path="/sell" element={<Sell />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/search" element={<SearchResults />} />
                  <Route path="/admin" element={<Admin />} />
                  <Route path="/orders" element={<Orders />} />
                  <Route path="/install" element={<Install />} />
                  <Route path="/analytics" element={<Analytics />} />
                  <Route path="/insights" element={<Insights />} />
                  <Route path="/pricing" element={<Pricing />} />

                  {/* 🔥 THIS FIXES YOUR 404 */}
                  <Route path="/auth/callback" element={<Navigate to="/" replace />} />

                  <Route path="*" element={<NotFound />} />
                </Routes>
              </VerticalThemeWrapper>
            </BrowserRouter>
          </VerticalProvider>
        </LocaleProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
