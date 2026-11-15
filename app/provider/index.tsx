import { QueryProvider } from "./QueryClientProvider";
import ProviderContent from "./ProviderContent";
import { StoreProvider } from "./StoreProvider";

const AppProvider = ({ children }: { children: React.ReactNode }) => {
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
