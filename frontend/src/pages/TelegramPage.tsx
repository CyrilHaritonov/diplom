"use client"

import { type FC, useEffect, useState, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Snackbar,
  Box,
  Container,
  IconButton,
  Card,
  CardContent,
  CircularProgress,
} from "@mui/material"
import { ArrowBack, ContentCopy, CopyAll, CopyAllOutlined, CopyAllRounded, CopyAllTwoTone } from "@mui/icons-material"
import { useAxios } from "../utils/hooks"

interface ChatBinding {
  user_id: string
  chat_id: string
  code: string
}

const TelegramPage: FC = () => {
  const navigate = useNavigate()
  const [connectionStatus, setConnectionStatus] = useState<string>("Ожидание статуса...")
  const [chatBinding, setChatBinding] = useState<ChatBinding | null>(null)
  const [isBotConnected, setIsBotConnected] = useState<boolean>(true)
  const [openConfirmation, setOpenConfirmation] = useState<boolean>(false)
  const [snackbarOpen, setSnackbarOpen] = useState<boolean>(false)
  const [snackbarMessage, setSnackbarMessage] = useState<string>("")
  const axiosInstance = useAxios(import.meta.env.VITE_API_URL)

  const checkBotConnection = useCallback(async () => {
    try {
      await axiosInstance.current?.get("/chat-bindings/check-fqdn")
      setIsBotConnected(true)
    } catch (error) {
      console.error("Ошибка при проверке подключения бота:", error)
      setIsBotConnected(false)
    }
  }, [axiosInstance])

  const fetchChatBinding = useCallback(async () => {
    try {
      const response = await axiosInstance.current?.get("/chat-bindings")
      setChatBinding(response?.data)

      if (response?.data.chat_id) {
        setConnectionStatus("Телеграм бот подключен к вашему аккаунту.")
      } else {
        setConnectionStatus("Нет активного подключения.")
      }
    } catch (error: any) {
      if (error.response.status === 404) {
        const createResponse = await axiosInstance.current?.post("/chat-bindings")
        if (createResponse?.status === 201) {
          setConnectionStatus("Нет активного подключения.")
          setChatBinding(createResponse.data)
        }
      } else {
        setConnectionStatus("Ошибка подключения.")
      }
    }
  }, [axiosInstance])

  useEffect(() => {
    fetchChatBinding()
    checkBotConnection()
  }, [fetchChatBinding, checkBotConnection])

  const handleDisconnectBot = async () => {
    try {
      await axiosInstance.current?.delete("/chat-bindings")
      setIsBotConnected(false)
      setSnackbarMessage("Бот успешно отключен.")
      setSnackbarOpen(true)
      fetchChatBinding()
      checkBotConnection()
    } catch (error) {
      console.error("Ошибка при отключении бота:", error)
      setSnackbarMessage("Произошла ошибка при отключении бота. Пожалуйста, попробуйте еще раз.")
      setSnackbarOpen(true)
    } finally {
      setOpenConfirmation(false)
    }
  }

  const handleOpenConfirmation = () => {
    setOpenConfirmation(true)
  }

  const handleCloseConfirmation = () => {
    setOpenConfirmation(false)
  }

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false)
  }

  const handleCopyToClipboard = async () => {
    if (chatBinding && chatBinding.code) {
      try {
        await navigator.clipboard.writeText(chatBinding.code)
        setSnackbarMessage("Код скопирован в буфер обмена!")
        setSnackbarOpen(true)
      } catch (error) {
        console.error("Ошибка при копировании кода:", error)
        setSnackbarMessage("Не удалось скопировать код.")
        setSnackbarOpen(true)
      }
    }
  }

  if (!isBotConnected) {
    return (
      <Box sx={{ py: 4, px: 2, backgroundColor: "#e9f4fb", minHeight: "100vh", borderRadius: "5px" }}>
        <Container maxWidth="lg">
          <Box sx={{ display: "flex", alignItems: "center", mb: 4 }}>
            <IconButton
              onClick={() => navigate("/workspaces")}
              sx={{ mr: 2 }}
              aria-label="Назад к рабочим пространствам"
            >
              <ArrowBack />
            </IconButton>
            <Typography variant="h4" component="h1" sx={{ color: "#1e293b", fontWeight: "bold" }}>
              Ошибка подключения
            </Typography>
          </Box>
          <Card>
            <CardContent>
              <Typography variant="body1" gutterBottom>
                Телеграм бот сервер не подключен. Пожалуйста, проверьте настройки.
              </Typography>
            </CardContent>
          </Card>
        </Container>
      </Box>
    )
  }

  return (
    <Box sx={{ py: 4, px: 2, backgroundColor: "#e9f4fb", minHeight: "100vh", borderRadius: "5px" }}>
      <Container maxWidth="lg">
        <Box sx={{ display: "flex", alignItems: "center", mb: 4 }}>
          <Typography variant="h4" component="h1" sx={{ color: "#1e293b", fontWeight: "bold" }}>
            Интеграция с Telegram
          </Typography>
        </Box>

        <Card sx={{ mb: 4 }}>
          <CardContent>
            {chatBinding ? (
              !chatBinding.chat_id.length ? (
                <Box>
                  <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Как подключить бота
                  </Typography>
                  <ol style={{marginLeft: 25}}>
                    <li>Найдите бота с тэгом {import.meta.env.VITE_BOT_TAG || "*****"} в Telegram</li>
                    <li>Начните диалог с ботом</li>
                    <li>Введите код подтверждения:</li>
                  </ol>
                  <Box
                    sx={{
                      backgroundColor: "#f1f5f9",
                      padding: 1,
                      borderRadius: 1,
                      display: "inline-block",
                      marginLeft: 3
                    }}
                  >
                    <Typography variant="body1" onClick={handleCopyToClipboard} style={{ cursor: 'pointer' }}>
                      {chatBinding.code}
                      <IconButton>
                        <ContentCopy />
                      </IconButton>
                    </Typography>
                  </Box>
                  </CardContent>
                </Box>
              ) : (
                <Box>
                  <Typography variant="h6" gutterBottom>
                  Статус подключения
                  </Typography>
                  <Typography variant="body1" paragraph>
                    {connectionStatus}
                  </Typography>
                  <Button
                    variant="outlined"
                    color="error"
                    onClick={handleOpenConfirmation}
                    sx={{
                      borderColor: "#ef4444",
                      color: "#ef4444",
                      "&:hover": {
                        backgroundColor: "rgba(239, 68, 68, 0.04)",
                        borderColor: "#dc2626",
                      },
                    }}
                  >
                    Отключить бота
                  </Button>
                </Box>
              )
            ) : (
              <CircularProgress size={24} />
            )}
          </CardContent>
        </Card>

        <Dialog open={openConfirmation} onClose={handleCloseConfirmation}>
          <DialogTitle>Подтверждение отключения</DialogTitle>
          <DialogContent>
            <Typography>Вы уверены, что хотите отключить бота?</Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseConfirmation} color="primary">
              Отмена
            </Button>
            <Button
              onClick={handleDisconnectBot}
              sx={{
                color: "#ef4444",
                "&:hover": {
                  backgroundColor: "rgba(239, 68, 68, 0.04)",
                },
              }}
            >
              Отключить
            </Button>
          </DialogActions>
        </Dialog>

        <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={handleCloseSnackbar} message={snackbarMessage} />
      </Container>
    </Box>
  )
}

export default TelegramPage

