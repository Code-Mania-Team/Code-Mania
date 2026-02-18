import { useContext, useDebugValue } from "react";
import { AuthContext } from "../context/AuthProvider.jsx";

const useAuth = () => {
  const context = useContext(AuthContext);

  useDebugValue(
    context,
    (ctx) => (ctx?.isAuthenticated ? "Authenticated" : "Unauthenticated")
  );

  return context;
};

export default useAuth;
