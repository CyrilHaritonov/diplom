import { FC } from 'react'
import { BrowserRouter, Route, Link, Routes } from 'react-router-dom'
import HomePage from './pages/HomePage'
import WorkspacesPage from './pages/WorkspacesPage'
import SecretsPage from './pages/SecretsPage'
import RolesPage from './pages/RolesPage'
import EventsPage from './pages/EventsPage'
import TelegramPage from './pages/TelegramPage'
import { ReactKeycloakProvider } from '@react-keycloak/web'
import { KeycloakInstance } from 'keycloak-js'
import { PrivateRoute } from './utils/PrivateRoute'
import UsersPage from './pages/UsersPage'

const AppRouter: FC = () => {
  return (
    <BrowserRouter>
      <nav>
        <Link to="/">Главная</Link>
        <Link to="/workspaces">Рабочие пространства</Link>
        <Link to="/events">События</Link>
        <Link to="/telegram">Telegram</Link>
      </nav>

      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/workspaces" element={<PrivateRoute element={<WorkspacesPage />} />} />
        <Route path="/workspaces/:workspaceId/secrets" element={<PrivateRoute element={<SecretsPage />} />} />
        <Route path="/workspaces/:workspaceId/roles" element={<PrivateRoute element={<RolesPage />} />} />
        <Route path="/workspaces/:workspaceId/users" element={<PrivateRoute element={<UsersPage />} />} />
        <Route path="/events" element={<EventsPage />} />
        <Route path="/telegram" element={<TelegramPage />} />
      </Routes>
    </BrowserRouter>
  )
}

const App: FC<{ keycloak: KeycloakInstance }> = ({ keycloak }) => {
  return (
    <ReactKeycloakProvider authClient={keycloak}>
      <AppRouter />
    </ReactKeycloakProvider>
  )
}

export default App
