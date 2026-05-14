import React, { useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

export default function AuthCallback() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setUser } = useAuth();
  const hasProcessed = useRef(false);

  useEffect(() => {
    if (hasProcessed.current) return;
    hasProcessed.current = true;
    const exchange = async () => {
      const hash = location.hash || window.location.hash;
      const m = hash.match(/session_id=([^&]+)/);
      if (!m) { navigate("/"); return; }
      const session_id = decodeURIComponent(m[1]);
      try {
        const { data } = await api.post("/auth/session", { session_id });
        setUser(data.user);
        navigate("/dashboard", { state: { user: data.user }, replace: true });
      } catch (e) {
        console.error("Auth callback failed", e);
        navigate("/?auth_error=1", { replace: true });
      }
    };
    exchange();
  }, [location, navigate, setUser]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white" data-testid="auth-callback-screen">
      <div className="text-center">
        <div className="font-mono text-xs tracking-[0.3em] text-zinc-500 mb-3">AUTHENTICATING</div>
        <div className="font-display text-2xl shimmer-text">Securing your draft chamber…</div>
      </div>
    </div>
  );
}
