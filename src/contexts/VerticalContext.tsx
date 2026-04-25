import { createContext, useContext, useState, ReactNode } from "react";

export type Vertical = "luxe" | "market" | "rent" | "services";

export const VERTICALS: { value: Vertical; label: string; description: string }[] = [
  { value: "luxe", label: "LUXE", description: "Artikuj luksi" },
  { value: "market", label: "MARKET", description: "Artikuj të përgjithshëm" },
  { value: "rent", label: "RENT", description: "Qira & prona" },
  { value: "services", label: "SERVICES", description: "Shërbime & freelance" },
];

interface VerticalContextType {
  vertical: Vertical;
  setVertical: (v: Vertical) => void;
}

const VerticalContext = createContext<VerticalContextType>({
  vertical: "luxe",
  setVertical: () => {},
});

export const VerticalProvider = ({ children }: { children: ReactNode }) => {
  const [vertical, setVertical] = useState<Vertical>("luxe");
  return (
    <VerticalContext.Provider value={{ vertical, setVertical }}>
      {children}
    </VerticalContext.Provider>
  );
};

export const useVertical = () => useContext(VerticalContext);
