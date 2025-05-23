
import React from "react";
import { Outlet } from "react-router-dom";
import RRHHSidenav from "./components/RRHHSidenav";
import RRHHHeader from "./components/RRHHHeader";

const RRHHLayout = () => (
  <div className="min-h-screen flex bg-gray-50">
    <RRHHSidenav />
    <div className="flex flex-col flex-1">
      <RRHHHeader />
      <main className="flex-1 px-6 py-4">
        <Outlet />
      </main>
    </div>
  </div>
);

export default RRHHLayout;
