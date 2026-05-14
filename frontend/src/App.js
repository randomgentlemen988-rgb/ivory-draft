import React from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { Toaster } from "sonner";

import { AuthProvider, useAuth } from "@/context/AuthContext";
import AuthCallback from "@/components/AuthCallback";
import ProtectedRoute from "@/components/ProtectedRoute";
import Header from "@/components/Header";

import Landing from "@/pages/Landing";
import Dashboard from "@/pages/Dashboard";
import Lobby from "@/pages/Lobby";
import GameRoom from "@/pages/GameRoom";
import Profile from "@/pages/Profile";
import Leaderboard from "@/pages/Leaderboard";
import Admin from "@/pages/Admin";

function AppRouter() {
  const location = useLocation();
  // Synchronous check (NOT in useEffect) prevents race conditions on OAuth callback
  if (location.hash?.includes("session_id=")) {
    return <AuthCallback />;
  }
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Shell><Dashboard /></Shell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/lobby"
        element={
          <ProtectedRoute>
            <Shell><Lobby /></Shell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/game/:gameId"
        element={
          <ProtectedRoute>
            <Shell><GameRoom /></Shell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile/:userId"
        element={
          <ProtectedRoute>
            <Shell><Profile /></Shell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/leaderboard"
        element={
          <ProtectedRoute>
            <Shell><Leaderboard /></Shell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <Shell><Admin /></Shell>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

function Shell({ children }) {
  const { user } = useAuth();
  return (
    <>
      {user && <Header />}
      <main>{children}</main>
    </>
  );
}

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <AuthProvider>
          <AppRouter />
          <Toaster
            position="top-right"
            theme="dark"
            toastOptions={{
              style: {
                background: "rgba(9,9,11,0.95)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "#fafafa",
                fontFamily: "Geist, sans-serif",
              },
            }}
          />
        </AuthProvider>
      </BrowserRouter>
    </div>
  );
}

export default App;
