import Header from "./Header";
import { Outlet } from "react-router-dom";

const DashboardLayout = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <>
        <Outlet />
      </>
    </div>
  );
};

export default DashboardLayout;
