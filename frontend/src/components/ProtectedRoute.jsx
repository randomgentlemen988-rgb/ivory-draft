import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-zinc-500" data-testid="auth-loading">
        <div className="font-mono text-xs tracking-[0.3em]">VERIFYING SESSION…</div>
      </div>
    );
  }
  if (!user) return <Navigate to="/" replace state={{ from: location }} />;
  return children;
}
