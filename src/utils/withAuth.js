import { useEffect, useState } from "react";
import { useRouter } from "next/router";

export default function withAuth(Component) {
  return function ProtectedPage(props) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
      const token =
        typeof window !== "undefined" ? localStorage.getItem("token") : null;

      if (!token) {
        router.replace("/auth");
      } else {
        setIsAuthenticated(true);
      }

      setIsLoading(false);
    }, [router]);

    if (isLoading) {
      return;
    }

    if (!isAuthenticated) {
      return null;
    }

    return <Component {...props} />;
  };
}
