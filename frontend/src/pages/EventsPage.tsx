"use client"

import type React from "react"

import { type FC, useEffect, useState, useCallback } from "react"
import { Link, useNavigate } from "react-router-dom"
import {
  Button,
  List,
  ListItem,
  ListItemText,
  Pagination,
  Checkbox,
  FormControlLabel,
  Typography,
  Box,
  Container,
  IconButton,
  Card,
  CardContent,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from "@mui/material"
import { ArrowBack, Download as DownloadIcon } from "@mui/icons-material"
import { useAxios } from "../utils/hooks"

interface Log {
  id: string
  user_id: string
  action: string
  subject: string
  timestamp: Date
  workspace_id?: string
  subject_name?: string
}

interface Workspace {
  id: string
  name: string
}

interface User {
  id: string
  username: string
}

// Mappings for actions and subjects
const actionTranslations: { [key: string]: string } = {
  create: "Создание",
  read: "Чтение",
  update: "Обновление",
  delete: "Удаление",
  access: "Доступ",
  export: "Экспорт",
};

const subjectTranslations: { [key: string]: string } = {
  workspace: "Рабочее пространство",
  role: "Роль",
  role_binding: "Роль пользователя",
  workspace_user: "Пользователь простраства",
  login: "Вход пользователя",
  logout: "Выход пользователя",
  user_info: "Информация о пользователе",
  log: "Лог",
  user_workspace_roles: "Роли пользователя пространства",
  event_binding: "Подписка на событие",
  secret: "Секрет",

};

const permissionsList = [
  { label: "Создание", value: "create" },
  { label: "Чтение", value: "read" },
  { label: "Обновление", value: "update" },
  { label: "Удаление", value: "delete" },
  { label: "Доступ", value: "access" },
  { label: "Экспорт", value: "export" },
]

const EventsPage: FC = () => {
  const navigate = useNavigate()
  const [logs, setLogs] = useState<Log[]>([])
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const logsPerPage = 25
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([])
  const axiosInstance = useAxios(import.meta.env.VITE_API_URL)

  const fetchLogs = useCallback(async () => {
    try {
      const response = await axiosInstance.current?.get("/logs/")
      const data = response?.data
      setLogs(data)
    } catch (error) {
      console.error("Failed to fetch logs:", error)
    }
  }, [axiosInstance])

  const fetchWorkspaces = useCallback(async () => {
    try {
      const response = await axiosInstance.current?.get("/workspaces")
      const data = response?.data
      setWorkspaces(data)
    } catch (error) {
      console.error("Failed to fetch workspaces:", error)
    }
  }, [axiosInstance])

  const fetchUsers = useCallback(async () => {
    try {
      const response = await axiosInstance.current?.get("/auth/users")
      const data = response?.data
      setUsers(data)
    } catch (error) {
      console.error("Failed to fetch users:", error)
    }
  }, [axiosInstance])

  useEffect(() => {
    fetchLogs()
    fetchWorkspaces()
    fetchUsers()
  }, [fetchLogs, fetchWorkspaces, fetchUsers])

  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setCurrentPage(value)
  }

  const handlePermissionChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = event.target
    setSelectedPermissions((prev) =>
      prev.includes(value) ? prev.filter((permission) => permission !== value) : [...prev, value],
    )
  }

  const filteredLogs = logs.filter((log) => {
    return selectedPermissions.length === 0 || selectedPermissions.includes(log.action)
  })

  const indexOfLastLog = currentPage * logsPerPage
  const indexOfFirstLog = indexOfLastLog - logsPerPage
  const currentLogs = filteredLogs.slice(indexOfFirstLog, indexOfLastLog)

  const handleExportLogs = async () => {
    try {
      const response = await axiosInstance.current?.get("/logs/export", {
        responseType: "blob",
      })
      if (!response) {
        throw new Error("No response")
      }
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement("a")
      link.href = url
      link.setAttribute("download", "logs_export.csv")
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch (error) {
      console.error("Failed to export logs:", error)
    }
  }

  return (
    <Box sx={{ py: 4, px: 2, backgroundColor: "#e9f4fb", minHeight: "100vh", borderRadius: "5px" }}>
      <Container maxWidth="lg">
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 4 }}>
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <IconButton
              onClick={() => navigate("/workspaces")}
              sx={{ mr: 2 }}
              aria-label="Назад к рабочим пространствам"
            >
              <ArrowBack />
            </IconButton>
            <Typography variant="h4" component="h1" sx={{ color: "#1e293b", fontWeight: "bold" }}>
              Журнал событий
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<DownloadIcon />}
            onClick={handleExportLogs}
            sx={{
              backgroundColor: "#0369a1",
              "&:hover": {
                backgroundColor: "#0284c7",
              },
            }}
          >
            Экспорт логов
          </Button>
        </Box>

        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Настройка уведомлений
            </Typography>
            <Grid container spacing={2}>
              {permissionsList.map((permission) => (
                <Grid item xs={6} sm={4} md={3} key={permission.value}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={selectedPermissions.includes(permission.value)}
                        onChange={handlePermissionChange}
                        value={permission.value}
                      />
                    }
                    label={permission.label}
                  />
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Журнал событий
            </Typography>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Время</TableCell>
                    <TableCell>Действие</TableCell>
                    <TableCell>Сущность</TableCell>
                    <TableCell>Пользователь</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {currentLogs.length ? currentLogs.map((log) => {
                    const user = users.find((u) => u.id === log.user_id)
                    return (
                      <TableRow key={log.id}>
                        <TableCell>
                          {new Date(log.timestamp).toLocaleString("ru-RU")}
                        </TableCell>
                        <TableCell>{actionTranslations[log.action] || log.action}</TableCell>
                        <TableCell>{subjectTranslations[log.subject] || log.subject}</TableCell>
                        <TableCell>{user ? user.username : "Неизвестный пользователь"}</TableCell>
                      </TableRow>
                    )
                  }) : (
                    <TableRow>
                      <TableCell colSpan={4} align="center">Загрузка...</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
              <Pagination
                count={Math.ceil(filteredLogs.length / logsPerPage)}
                page={currentPage}
                onChange={handlePageChange}
                variant="outlined"
                shape="rounded"
              />
            </Box>
          </CardContent>
        </Card>
      </Container>
    </Box>
  )
}

export default EventsPage

