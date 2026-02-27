import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import useAuth from "../hooks/useAxios";

const ProtectedRoute = ({ children, onRequireAuth }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      onRequireAuth?.();

      // Redirect back to safe page
      if (location.pathname.includes("/learn/python/exercise")) {
        navigate("/learn/python", { replace: true });
      } else if (location.pathname.includes("/learn/javascript/exercise")) {
        navigate("/learn/javascript", { replace: true });
      } else if (location.pathname.includes("/learn/cpp/exercise")) {
        navigate("/learn/cpp", { replace: true });
      } else if (
        location.pathname.includes("/quiz") ||
        location.pathname.includes("/exam") ||
        location.pathname.includes("/coding-exam")
      ) {
        navigate("/learn", { replace: true });
      } else if (location.pathname.includes("/dashboard")) {
        navigate("/", { replace: true });
      }
    }
  }, [isAuthenticated, isLoading, onRequireAuth, navigate, location.pathname]);

  if (isLoading) return null;

  if (!isAuthenticated) return null;

  return children;
};

export default ProtectedRoute;