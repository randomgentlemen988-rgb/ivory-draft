import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { LogOut, LayoutGrid, Users, Trophy, User, Shield, PenLine } from "lucide-react";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutGrid },
  { to: "/lobby", label: "Lobbies", icon: Users },
  { to: "/leaderboard", label: "Leaderboard", icon: Trophy },
];

export default function Header() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 glass-strong hairline-b" data-testid="app-header">
      <div className="max-w-7xl mx-auto px-6 lg:px-10 h-16 flex items-center justify-between">
        <Link to={user ? "/dashboard" : "/"} className="flex items-center gap-2.5 group" data-testid="logo-link">
          <div className="w-7 h-7 rounded-md bg-white text-black flex items-center justify-center">
            <PenLine className="w-4 h-4" />
          </div>
          <div>
            <div className="font-display font-semibold tracking-tight text-[15px]">Ivory Draft</div>
            <div className="font-mono text-[9px] tracking-[0.3em] text-zinc-500 -mt-0.5">DRAFT.ARENA</div>
          </div>
        </Link>

        {user && (
          <nav className="hidden md:flex items-center gap-1">
            {NAV.map((n) => {
              const Icon = n.icon;
              const active = location.pathname.startsWith(n.to);
              return (
                <Link
                  key={n.to}
                  to={n.to}
                  data-testid={`nav-${n.label.toLowerCase()}`}
                  className={`flex items-center gap-2 px-3 h-9 rounded-md text-sm font-medium transition-colors ${
                    active
                      ? "bg-white/10 text-white"
                      : "text-zinc-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <Icon className="w-4 h-4" /> {n.label}
                </Link>
              );
            })}
            {user.role === "admin" && (
              <Link
                to="/admin"
                data-testid="nav-admin"
                className={`flex items-center gap-2 px-3 h-9 rounded-md text-sm font-medium transition-colors ${
                  location.pathname.startsWith("/admin")
                    ? "bg-white/10 text-white"
                    : "text-zinc-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <Shield className="w-4 h-4" /> Admin
              </Link>
            )}
          </nav>
        )}

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <button
                data-testid="profile-link"
                onClick={() => navigate(`/profile/${user.user_id}`)}
                className="flex items-center gap-2 px-2 h-9 rounded-md hover:bg-white/5 transition-colors"
              >
                {user.picture ? (
                  <img src={user.picture} alt="" className="w-7 h-7 rounded-full" />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-zinc-800 flex items-center justify-center text-xs">
                    <User className="w-3.5 h-3.5" />
                  </div>
                )}
                <span className="hidden sm:block text-sm">{user.name}</span>
              </button>
              <button
                data-testid="logout-button"
                onClick={logout}
                className="h-9 px-3 rounded-md text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
                title="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </>
          ) : null}
        </div>
      </div>
    </header>
  );
}
