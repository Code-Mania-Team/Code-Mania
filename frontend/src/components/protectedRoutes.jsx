import { Navigate, useLocation } from "react-router-dom";
import useAuth from "../hooks/useAxios";

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // Wait for auth check to complete before redirecting
  if (isLoading) return null;

  if (!isAuthenticated) {
    let redirectTo = "/";

    // Exercise routes → go back to course
    if (location.pathname.includes("/learn/python/exercise")) {
      redirectTo = "/learn/python";
    }
    else if (location.pathname.includes("/learn/javascript/exercise")) {
      redirectTo = "/learn/javascript";
    }
    else if (location.pathname.includes("/learn/cpp/exercise")) {
      redirectTo = "/learn/cpp";
    }
    // Quiz & exams → go back to learn page
    else if (
      location.pathname.includes("/quiz") ||
      location.pathname.includes("/exam") ||
      location.pathname.includes("/coding-exam")
    ) {
      redirectTo = "/learn";
    }
    // Dashboard → go home
    else if (location.pathname.includes("/dashboard")) {
      redirectTo = "/";
    }

    return (
      <Navigate
        to={redirectTo}
        replace
        state={{
          openSignIn: true,
          redirectAfterLogin: location.pathname
        }}
      />
    );
  }

  return children;
};

export default ProtectedRoute;