import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import useAuth from "../hooks/useAxios";
import { axiosPublic } from "../api/axios";

const ProtectedRoute = ({ children }) => {
  const { setIsAuthenticated, setUser } = useAuth();
  const [authorized, setAuthorized] = useState(null);

  useEffect(() => {
    const verify = async () => {
      try {
        const res = await axiosPublic.get("/v1/account", {
          withCredentials: true,
        });

        setUser(res.data.data);
        setIsAuthenticated(true);
        setAuthorized(true);
      } catch {
        try {
          await axiosPublic.get("/v1/refresh", {
            withCredentials: true,
          });

          const retry = await axiosPublic.get("/v1/account", {
            withCredentials: true,
          });

          setUser(retry.data.data);
          setIsAuthenticated(true);
          setAuthorized(true);
        } catch {
          setIsAuthenticated(false);
          setAuthorized(false);
        }
      }
    };

    verify();
  }, []);

  if (authorized === null) return null;

  if (!authorized) return <Navigate to="/" replace />;

  return children;
};

export default ProtectedRoute;