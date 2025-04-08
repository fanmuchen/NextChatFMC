"use client";

import { useState, useEffect } from "react";
import styles from "./auth.module.scss";
import { IconButton } from "./button";

export function UserProfile() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userName, setUserName] = useState("");

  useEffect(() => {
    // Check authentication status on client side
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/auth/status");
        if (response.ok) {
          const data = await response.json();
          setIsAuthenticated(data.isAuthenticated);
          if (data.claims && data.claims.name) {
            setUserName(data.claims.name);
          } else if (data.claims && data.claims.sub) {
            setUserName(data.claims.sub);
          }
        }
      } catch (error) {
        console.error("Failed to fetch auth status:", error);
      }
    };

    checkAuth();

    // Add event listener for unauthorized events
    const handleUnauthorized = () => {
      console.log(
        "[UserProfile] Received unauthorized event, updating auth state",
      );
      setIsAuthenticated(false);
      setUserName("");
    };

    window.addEventListener("auth:unauthorized", handleUnauthorized);

    // Clean up event listener on unmount
    return () => {
      window.removeEventListener("auth:unauthorized", handleUnauthorized);
    };
  }, []);

  const handleSignOut = () => {
    window.location.href = "/api/auth/signout";
  };

  if (!isAuthenticated) {
    return (
      <IconButton
        text="Sign In"
        onClick={() => {
          window.location.href = "/api/auth/signin";
        }}
      />
    );
  }

  return (
    <div className={styles["user-profile"]}>
      <span>Welcome, {userName || "User"}</span>
      <IconButton text="Sign Out" onClick={handleSignOut} />
    </div>
  );
}
