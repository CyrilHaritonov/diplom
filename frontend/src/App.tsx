"use client"

import type React from "react"

import { type FC, useEffect, useState } from "react"
import { BrowserRouter, Route, Link as RouterLink, Routes } from "react-router-dom"
import { ReactKeycloakProvider, useKeycloak } from "@react-keycloak/web"
import type { KeycloakInstance } from "keycloak-js"
import { AppBar, Toolbar, Typography, Button, Box, Container, Link, Menu, MenuItem, IconButton } from "@mui/material"
import { Menu as MenuIcon, Home, WorkOutline, EventNote, Telegram, ExitToApp, Login } from "@mui/icons-material"
import HomePage from "./pages/HomePage"
import WorkspacesPage from "./pages/WorkspacesPage"
import SecretsPage from "./pages/SecretsPage"
import RolesPage from "./pages/RolesPage"
import EventsPage from "./pages/EventsPage"
import TelegramPage from "./pages/TelegramPage"
import UsersPage from "./pages/UsersPage"
import { PrivateRoute } from "./utils/PrivateRoute"
import { useAxios } from "./utils/hooks"

const AppRouter: FC = () => {
  const { keycloak } = useKeycloak()
  const [username, setUsername] = useState<string | null>(null)
  const axiosInstance = useAxios(import.meta.env.VITE_API_URL)
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)

  const fetchUsername = async () => {
    if (keycloak.authenticated) {
      try {
        const userId = keycloak.tokenParsed?.sub
        const response = await axiosInstance.current?.get(`/auth/user-id/${userId}`)
        const data = response?.data
        setUsername(data.username)
      } catch (error) {
        console.error("Failed to fetch username:", error)
      }
    }
  }

  useEffect(() => {
    if (keycloak.authenticated) {
      fetchUsername()
    }
  }, [keycloak.authenticated])

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  const navItems = [
    { title: "Главная", path: "/", icon: <Home /> },
    { title: "Рабочие пространства", path: "/workspaces", icon: <WorkOutline /> },
    { title: "События", path: "/events", icon: <EventNote /> },
    { title: "Telegram", path: "/telegram", icon: <Telegram /> },
  ]

  return (
    <BrowserRouter>
      <AppBar position="fixed" sx={{ backgroundColor: "rgba(255, 255, 255, 0.8)", backdropFilter: "blur(8px)" }}>
        <Container maxWidth="lg">
          <Toolbar disableGutters>
            <Typography
              variant="h6"
              noWrap
              component={RouterLink}
              to="/"
              sx={{
                mr: 2,
                display: { xs: "none", md: "flex" },
                fontWeight: 700,
                color: "#1e293b",
                textDecoration: "none",
              }}
            >
              Secret Storage
            </Typography>

            <Box sx={{ flexGrow: 1, display: { xs: "flex", md: "none" } }}>
              <IconButton
                size="large"
                aria-label="account of current user"
                aria-controls="menu-appbar"
                aria-haspopup="true"
                onClick={handleMenu}
                sx={{ color: "#1e293b" }}
              >
                <MenuIcon />
              </IconButton>
              <Menu
                id="menu-appbar"
                anchorEl={anchorEl}
                anchorOrigin={{
                  vertical: "bottom",
                  horizontal: "left",
                }}
                keepMounted
                transformOrigin={{
                  vertical: "top",
                  horizontal: "left",
                }}
                open={Boolean(anchorEl)}
                onClose={handleClose}
                sx={{
                  display: { xs: "block", md: "none" },
                }}
              >
                {navItems.map((item) => (
                  <MenuItem key={item.path} onClick={handleClose} component={RouterLink} to={item.path}>
                    {item.icon}
                    <Typography sx={{ ml: 1 }}>{item.title}</Typography>
                  </MenuItem>
                ))}
              </Menu>
            </Box>

            <Typography
              variant="h5"
              noWrap
              component={RouterLink}
              to="/"
              sx={{
                mr: 2,
                display: { xs: "flex", md: "none" },
                flexGrow: 1,
                fontWeight: 700,
                color: "#1e293b",
                textDecoration: "none",
              }}
            >
              Secret Storage
            </Typography>

            <Box sx={{ flexGrow: 1, display: { xs: "none", md: "flex" } }}>
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  component={RouterLink}
                  to={item.path}
                  color="#334155"
                  sx={{
                    mx: 2,
                    display: "flex",
                    alignItems: "center",
                    textDecoration: "none",
                    "&:hover": { color: "#0369a1" },
                  }}
                >
                  {item.icon}
                  <Typography sx={{ ml: 0.5 }}>{item.title}</Typography>
                </Link>
              ))}
            </Box>

            <Box sx={{ flexGrow: 0 }}>
              {username && (
                <Typography variant="body1" sx={{ display: "inline", mr: 2, color: "#334155" }}>
                  {username}
                </Typography>
              )}
              {keycloak.authenticated ? (
                <Button
                  variant="outlined"
                  onClick={() => keycloak.logout()}
                  startIcon={<ExitToApp />}
                  sx={{
                    color: "#0369a1",
                    borderColor: "#0369a1",
                    "&:hover": {
                      backgroundColor: "rgba(3, 105, 161, 0.04)",
                      borderColor: "#0284c7",
                    },
                  }}
                >
                  Выйти
                </Button>
              ) : (
                <Button
                  variant="contained"
                  onClick={() => keycloak.login()}
                  startIcon={<Login />}
                  sx={{
                    backgroundColor: "#0369a1",
                    "&:hover": {
                      backgroundColor: "#0284c7",
                    },
                  }}
                >
                  Войти
                </Button>
              )}
            </Box>
          </Toolbar>
        </Container>
      </AppBar>
      <Toolbar /> {/* This empty Toolbar acts as a spacer */}
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/workspaces" element={<PrivateRoute element={<WorkspacesPage />} />} />
          <Route path="/workspaces/:workspaceId/secrets" element={<PrivateRoute element={<SecretsPage />} />} />
          <Route path="/workspaces/:workspaceId/roles" element={<PrivateRoute element={<RolesPage />} />} />
          <Route path="/workspaces/:workspaceId/users" element={<PrivateRoute element={<UsersPage />} />} />
          <Route path="/events" element={<EventsPage />} />
          <Route path="/telegram" element={<TelegramPage />} />
        </Routes>
      </Container>
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

