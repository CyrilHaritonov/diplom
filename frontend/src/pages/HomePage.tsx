import type { FC } from "react"
import { Button, Container, Typography, Box, Grid, Paper, useTheme } from "@mui/material"
import { useNavigate } from "react-router-dom"
import { useKeycloak } from "@react-keycloak/web"
import { Lock, Group, Speed } from "@mui/icons-material"
import AnimatedBackground from "../utils/AnimatedBackground"
import React from "react"

const HomePage: FC = () => {
  const navigate = useNavigate()
  const { keycloak } = useKeycloak()
  const theme = useTheme()

  const features = [
    {
      icon: <Lock fontSize="large" />,
      title: "Безопасность",
      description: "Шифрование на уровне военных стандартов для защиты ваших секретов",
    },
    {
      icon: <Group fontSize="large" />,
      title: "Командная работа",
      description: "Легкое управление доступом и совместное использование секретов",
    },
    {
      icon: <Speed fontSize="large" />,
      title: "Производительность",
      description: "Быстрый доступ к секретам для оптимизации рабочего процесса",
    },
  ]

  const handleMainButtonClick = () => {
    if (keycloak.authenticated) {
      navigate("/workspaces")
    } else {
      keycloak.login();
    }
  };

  return (
    <>
      <AnimatedBackground />
      <Container maxWidth="lg">
        <Box
          sx={{
            marginTop: 8,
            marginBottom: 8,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 6,
            position: "relative",
            zIndex: 1,
          }}
        >
          <Typography
            variant="h2"
            component="h1"
            align="center"
            gutterBottom
            sx={{ color: "#1e293b", fontWeight: "bold" }}
          >
            Secret Storage
          </Typography>

          <Typography variant="h5" component="h2" align="center" sx={{ color: "#334155" }} paragraph>
            Безопасное хранение секретов для вашей команды
          </Typography>

          <Button
            variant="contained"
            size="large"
            onClick={handleMainButtonClick}
            sx={{
              fontSize: "1.2rem",
              padding: "12px 24px",
              backgroundColor: "#0369a1",
              "&:hover": {
                backgroundColor: "#0284c7",
              },
            }}
          >
            {keycloak.authenticated ? "Перейти к пространствам" : "Начать работу"}
          </Button>

          <Grid container spacing={4} justifyContent="center">
            {features.map((feature, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <Paper
                  elevation={3}
                  sx={{
                    p: 3,
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    transition: "transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out",
                    "&:hover": {
                      transform: "translateY(-5px)",
                      boxShadow: theme.shadows[6],
                    },
                    backgroundColor: "rgba(255, 255, 255, 0.9)",
                    backdropFilter: "blur(8px)",
                  }}
                >
                  {React.cloneElement(feature.icon, { sx: { color: "#0369a1" } })}
                  <Typography variant="h6" component="h3" align="center" gutterBottom sx={{ mt: 2, color: "#1e293b" }}>
                    {feature.title}
                  </Typography>
                  <Typography variant="body2" align="center" sx={{ color: "#334155" }}>
                    {feature.description}
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>

          <Box
            sx={{
              mt: 4,
              backgroundColor: "rgba(255, 255, 255, 0.9)",
              backdropFilter: "blur(8px)",
              padding: 4,
              borderRadius: 2,
            }}
          >
          <Typography variant="h4" component="h2" align="center" gutterBottom sx={{ color: "#1e293b" }}>
              Почему выбирают Secret Storage?
            </Typography>
            <Typography variant="body1" align="center" paragraph sx={{ color: "#334155" }}>
              Secret Storage предоставляет надежное и удобное решение для хранения и управления конфиденциальной
              информацией вашей команды. Наша платформа обеспечивает высочайший уровень безопасности, интуитивно
              понятный интерфейс и эффективные инструменты для совместной работы.
            </Typography>
          </Box>
        </Box>
      </Container>
    </>
  )
}

export default HomePage

