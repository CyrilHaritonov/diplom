import * as React from 'react'
import { Navigate } from 'react-router-dom'

import { useKeycloak } from '@react-keycloak/web'

interface PrivateRouteParams {
  element: React.ReactNode
}

export function PrivateRoute({
  element
}: PrivateRouteParams) {
  const { keycloak } = useKeycloak()
  if (!keycloak.authenticated) {
    return setTimeout(() => {
      return keycloak.authenticated ? element : <Navigate to="/" replace/>
    }, 10)
  }
  return keycloak.authenticated ? element : <Navigate to="/" replace/>
}