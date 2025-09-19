import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/context/AuthContext";

const withAuth = (WrappedComponent, options = {}) => {
  const { requireAdmin = false } = options;

  return function AuthenticatedComponent(props) {
    const { token, user, isLoading } = useAuth();
    const router = useRouter();
    const [isRedirecting, setIsRedirecting] = useState(false);

    useEffect(() => {
      if (isLoading) return;

      if (!token) {
        setIsRedirecting(true);
        router.replace("/auth");
        return;
      }

      const hasAdminPermission = user?.permissions?.some((permission) =>
        ["manage_roles", "manage_users", "manage_permissions"].includes(
          permission
        )
      );

      if (requireAdmin) {
        if (!hasAdminPermission) {
          setIsRedirecting(true);
          router.replace("/");
        }
      } else {
        if (hasAdminPermission && router.pathname === "/") {
          setIsRedirecting(true);
          router.replace("/comments");
        }
      }
    }, [token, user, isLoading, router, requireAdmin]);

    if (isLoading || isRedirecting) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      );
    }

    if (!token) {
      return null;
    }

    const hasAdminPermission = user?.permissions?.some((permission) =>
      ["manage_roles", "manage_users", "manage_permissions"].includes(
        permission
      )
    );

    if (requireAdmin && !hasAdminPermission) {
      return null;
    }

    if (!requireAdmin && hasAdminPermission && router.pathname === "/") {
      return null;
    }

    return <WrappedComponent {...props} />;
  };
};

export default withAuth;
