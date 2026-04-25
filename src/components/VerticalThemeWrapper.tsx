import { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { useVertical } from "@/contexts/VerticalContext";

// Routes that must always render with the brand "luxe" (dark + gold) theme,
// regardless of which vertical the user last selected.
const LUXE_ROUTES = new Set<string>(["/", "/index", "/login", "/install", "/pricing"]);

const VerticalThemeWrapper = ({ children }: { children: ReactNode }) => {
  const { vertical } = useVertical();
  const { pathname } = useLocation();

  const effectiveVertical = LUXE_ROUTES.has(pathname) ? "luxe" : vertical;

  return (
    <div
      data-vertical={effectiveVertical}
      data-testid="vertical-theme-wrapper"
      className="min-h-screen bg-background text-foreground transition-colors duration-300"
    >
      {children}
    </div>
  );
};

export default VerticalThemeWrapper;
