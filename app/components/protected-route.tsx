"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loading } from "./home";
import { useAuthStore } from "../store/auth";
import { fetchWithAuthHandling } from "../utils/fetch-wrapper";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const router = useRouter();
  const { isAuthenticated, isRefreshing, setAuthenticated } = useAuthStore();

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const response = await fetchWithAuthHandling("/api/auth/status");
        if (response.ok) {
          const data = await response.json();
          setAuthenticated(data.isAuthenticated);

          if (!data.isAuthenticated && !isRefreshing) {
            // Only redirect if we're not in the process of refreshing
            router.push("/");
          }
        } else {
          // Handle error response
          setAuthenticated(false);
          if (!isRefreshing) {
            router.push("/");
          }
        }
      } catch (error) {
        console.error("Error checking authentication status:", error);
        setAuthenticated(false);
        if (!isRefreshing) {
          router.push("/");
        }
      }
    };

    checkAuthStatus();
  }, [router, setAuthenticated, isRefreshing]);

  // Show loading spinner while checking authentication or refreshing token
  if (isAuthenticated === null || isRefreshing) {
    return <Loading />;
  }

  // Only render children if authenticated
  return isAuthenticated ? <>{children}</> : null;
}
