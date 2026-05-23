import { QueryProvider } from "./QueryClientProvider";
import ProviderContent from "./ProviderContent";
import { StoreProvider } from "./StoreProvider";
import { useState } from "react";

const AppProvider = ({ children }: { children: React.ReactNode }) => {
  const [first, setfirst] = useState("second");
  return (
    <StoreProvider>
      <QueryProvider>
        {children}
        <ProviderContent />
      </QueryProvider>
    </StoreProvider>
  );
};

export default AppProvider;
