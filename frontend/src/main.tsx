import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import Keycloak from 'keycloak-js'

const keycloak = new Keycloak({
  url: import.meta.env.VITE_KEYCLOAK_URL as string,
  realm: import.meta.env.VITE_KEYCLOAK_REALM as string,
  clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID as string
})

createRoot(document.getElementById('root')!).render(
      <App keycloak={keycloak}/>
)
