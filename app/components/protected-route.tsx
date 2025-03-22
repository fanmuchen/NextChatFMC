"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loading } from "./home";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const router = useRouter();

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const response = await fetch("/api/auth/status");
        if (response.ok) {
          const data = await response.json();
          setIsAuthenticated(data.isAuthenticated);

          if (!data.isAuthenticated) {
            // Redirect to auth page if not authenticated
            router.push("/");
          }
        } else {
          // Handle error response
          setIsAuthenticated(false);
          router.push("/");
        }
      } catch (error) {
        console.error("Error checking authentication status:", error);
        setIsAuthenticated(false);
        router.push("/");
      }
    };

    checkAuthStatus();
  }, [router]);

  // Show loading spinner while checking authentication
  if (isAuthenticated === null) {
    return <Loading />;
  }

  // Only render children if authenticated
  return isAuthenticated ? <>{children}</> : null;
}
