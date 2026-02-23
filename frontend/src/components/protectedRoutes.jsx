import { Navigate, useLocation } from "react-router-dom";
import useAuth from "../hooks/useAxios";

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // 🔒 WAIT until auth finishes checking
  if (isLoading) {
    return null; // or a spinner
  }

  if (!isAuthenticated) {
    let redirectTo = "/";

    if (location.pathname.includes("/learn/python/exercise")) {
      redirectTo = "/learn/python";
    } 
    else if (location.pathname.includes("/learn/javascript/exercise")) {
      redirectTo = "/learn/javascript";
    } 
    else if (location.pathname.includes("/learn/cpp/exercise")) {
      redirectTo = "/learn/cpp";
    }
    else if (
      location.pathname.includes("/quiz") ||
      location.pathname.includes("/exam") ||
      location.pathname.includes("/coding-exam")
    ) {
      redirectTo = "/learn";
    }
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