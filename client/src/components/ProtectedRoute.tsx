import { Navigate } from "react-router-dom";
import { ReactNode } from "react";
export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const loggedIn = !!localStorage.getItem("access");
  return loggedIn ? <>{children}</> : <Navigate to="/login" replace />;
}
