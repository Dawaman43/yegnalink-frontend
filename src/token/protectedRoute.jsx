import { Navigate, Outlet } from "react-router-dom";
import { useEffect, useState } from "react";

const ProtectedRoute = () => {
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (token) {
      setAuthorized(true);
    }

    setLoading(false);
  }, []);

  if (loading) return <div>Loading...</div>;

  return authorized ? <Outlet /> : <Navigate to="/login" replace />;
};

export default ProtectedRoute;
