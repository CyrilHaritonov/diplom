import { FC, useState } from 'react'
import { Button, Container, Typography, Box } from '@mui/material'
import { useNavigate, Navigate } from 'react-router-dom'
import { useKeycloak } from '@react-keycloak/web'

const HomePage: FC = () => {
  const navigate = useNavigate()
  const { keycloak } = useKeycloak()

  const handleStart = () => {
    navigate('/workspaces')
  }


  return (
    <Container maxWidth="sm">
      <Box sx={{ 
        marginTop: 8,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 4
      }}>
        <Typography variant="h2" component="h1" align="center">
          Secret Storage
        </Typography>
        
        <Typography variant="h5" component="h2" align="center">
          Безопасное хранение секретов для вашей команды
        </Typography>

        <Button 
          variant="contained" 
          size="large"
          onClick={handleStart}
        >
          Перейти к пространствам
        </Button>
      {keycloak.authenticated && <Button 
        variant="outlined" 
        size="large"
        onClick={() => {
          keycloak.logout()
        }}
      >
        Выйти
      </Button>}
      {!keycloak.authenticated && <Button 
        variant="outlined" 
        size="large"
        onClick={() => {
          keycloak.login()
        }}
      >
        Войти
      </Button>}
      </Box>
    </Container>
  )
}

export default HomePage 