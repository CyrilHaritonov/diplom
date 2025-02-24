import * as React from "react";
import { Navigate } from "react-router-dom";
import { useKeycloak } from "@react-keycloak/web";

interface PrivateRouteParams {
  element: React.ReactNode;
}

export function PrivateRoute({ element }: PrivateRouteParams) {
  const { keycloak } = useKeycloak();
  const [isChecking, setIsChecking] = React.useState(true);

  React.useEffect(() => {
    const timeout = setTimeout(() => {
      setIsChecking(false);
    }, 200); // Small delay to let Keycloak initialize

    return () => clearTimeout(timeout);
  }, []);

  if (isChecking || !keycloak) {
    return <div>Waiting for Keycloak...</div>;
  }

  return keycloak.authenticated ? element : <Navigate to="/" replace />;
}