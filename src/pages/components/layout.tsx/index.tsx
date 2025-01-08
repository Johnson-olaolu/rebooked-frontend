import React from "react";
import Header from "./Header";
import Footer from "./Footer";
import AnnouncementBar from "./AnnouncementBar";

const DefaultLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <>
      <div className="min-h-screen bg-background">
        <AnnouncementBar />
        <Header />
        {children}
        <Footer />
      </div>
    </>
  );
};

export default DefaultLayout;
