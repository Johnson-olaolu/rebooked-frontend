import React from "react";
import SalesChart from "./components/SalesChart";
import BookTable from "./components/BookTable";

const DashboardHome = () => {
  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Seller Dashboard</h1>
      <div className="mb-8">
        <SalesChart />
      </div>
      <BookTable />
    </main>
  );
};

export default DashboardHome;
