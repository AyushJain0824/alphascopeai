import React from "react";
import { useAuth } from "../../../hooks/useAuth";
import PasswordAuthScreen from "./PasswordAuthScreen";

/**
 * Renders children only when the local password session is active.
 */
export function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <PasswordAuthScreen />;
  return children;
}
