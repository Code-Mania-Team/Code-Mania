import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import useAuth from "../hooks/useAxios";

const ProtectedRoute = ({ children, onRequireAuth }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isPublicGuestExercise = (() => {
    const pathname = location.pathname || "";
    const isExerciseRoute =
      pathname.startsWith("/learn/python/exercise") ||
      pathname.startsWith("/learn/javascript/exercise") ||
      pathname.startsWith("/learn/cpp/exercise");

    if (!isExerciseRoute) return false;

    const parts = pathname.split("/").filter(Boolean);
    const exerciseIdx = parts.indexOf("exercise");
    if (exerciseIdx === -1) return false;

    // Support both:
    // - /learn/<lang>/exercise/<exerciseId>
    // - /learn/cpp/exercise/<moduleId>/<exerciseId>
    const lastPart = parts[parts.length - 1];
    const exerciseId = Number(lastPart);
    if (!Number.isFinite(exerciseId)) return false;

    return exerciseId === 1 || exerciseId === 2;
  })();

  useEffect(() => {
    if (!isLoading && !isAuthenticated && !isPublicGuestExercise) {
      onRequireAuth?.();

      // Redirect back to safe page
      if (
        location.pathname.includes("/learn/python/exercise") ||
        location.pathname.includes("/learn/javascript/exercise") ||
        location.pathname.includes("/learn/cpp/exercise")
      ) {
        navigate("/", { replace: true, state: { openSignIn: true } });
      } else if (
        location.pathname.includes("/quiz") ||
        location.pathname.includes("/exam") ||
        location.pathname.includes("/coding-exam")
      ) {
        navigate("/learn", { replace: true });
      } else if (location.pathname.includes("/terminal")) {
        navigate("/learn", { replace: true });
      } else if (location.pathname.includes("/dashboard")) {
        navigate("/", { replace: true });
      }
    }
  }, [isAuthenticated, isLoading, isPublicGuestExercise, onRequireAuth, navigate, location.pathname]);

  if (isLoading) return null;

  if (!isAuthenticated && !isPublicGuestExercise) return null;

  return children;
};

export default ProtectedRoute;
