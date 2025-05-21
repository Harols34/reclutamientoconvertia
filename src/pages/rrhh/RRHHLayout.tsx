
import React from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import RRHHSidebar from "./RRHHSidebar";
import { getRRHHUser } from "../../utils/rrhh-auth";

const RRHHLayout = () => {
  const navigate = useNavigate();
  const user = getRRHHUser();
  const location = useLocation();

  React.useEffect(() => {
    if (!user) navigate("/rrhh/login");
  }, [user, navigate, location.pathname]);

  if (!user) return null;

  return (
    <div className="w-full min-h-screen flex bg-gradient-to-br from-hrm-dark-cyan/10 to-purple-100">
      <RRHHSidebar />
      <main className="flex-1 px-6 py-8">
        <Outlet />
      </main>
    </div>
  );
};

export default RRHHLayout;
