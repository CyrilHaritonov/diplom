"use client"

import type React from "react"

import { type FC, useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Typography,
  Box,
  Container
} from "@mui/material"
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility,
  VisibilityOff,
  ContentCopy,
  ArrowBack,
  Add as AddIcon
} from "@mui/icons-material"
import { useAxios } from "../utils/hooks"
import { Link } from "react-router";
import { Dialog as ConfirmationDialog } from "@mui/material"

interface Secret {
  id: string
  name: string
  value: string
  workspace_id: string
  created_by: string
  expires_at?: Date | null
  created_at: Date
}

interface Workspace {
  id: string
  name: string
}

const SecretsPage: FC = () => {
  const { workspaceId } = useParams<{ workspaceId: string }>()
  const navigate = useNavigate()
  const [openModal, setOpenModal] = useState(false)
  const [secretName, setSecretName] = useState("")
  const [secretValue, setSecretValue] = useState("")
  const [secrets, setSecrets] = useState<Secret[]>([])
  const [expiresAt, setExpiresAt] = useState<Date | null>(null)
  const [editingSecretId, setEditingSecretId] = useState<string | null>(null)
  const [openSecretModal, setOpenSecretModal] = useState(false)
  const [selectedSecret, setSelectedSecret] = useState<Secret | null>(null)
  const [showValue, setShowValue] = useState(false)
  const [workspaceName, setWorkspaceName] = useState<string | null>("")
  const [searchTerm, setSearchTerm] = useState("")
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const axiosInstance = useAxios(import.meta.env.VITE_API_URL)
  const [showExpiration, setShowExpiration] = useState(false)
  const [showSecretValue, setShowSecretValue] = useState(false)
  const [openConfirmationDialog, setOpenConfirmationDialog] = useState(false)
  const [secretToDelete, setSecretToDelete] = useState<string | null>(null)
  const [creatorUsername, setCreatorUsername] = useState<string | null>(null)

  const handleOpenModal = () => {
    setOpenModal(true)
  }

  const handleCloseModal = () => {
    setOpenModal(false)
    setSecretName("")
    setSecretValue("")
    setExpiresAt(null)
    setEditingSecretId(null)
  }

  const handleCreateOrUpdateSecret = async (event: React.FormEvent) => {
    event.preventDefault()
    try {
      if (editingSecretId) {
        await axiosInstance.current?.put(`/secrets/${editingSecretId}`, {
          name: secretName,
          value: secretValue,
          expires_at: expiresAt,
        })
        setSecrets((prev) =>
          prev.map((secret) =>
            secret.id === editingSecretId
              ? { ...secret, name: secretName, value: secretValue, expires_at: expiresAt }
              : secret,
          ),
        )
      } else {
        const response = await axiosInstance.current?.post(`/secrets`, {
          name: secretName,
          value: secretValue,
          workspace_id: workspaceId,
          expires_at: expiresAt,
        })
        const newSecret = response?.data
        setSecrets((prev) => [...prev, newSecret])
      }
      fetchSecrets();
      handleCloseModal()
    } catch (error) {
      console.error("Failed to create or update secret:", error)
    }
  }

  const fetchSecrets = async () => {
    try {
      const response = await axiosInstance.current?.get(`/secrets/workspace/${workspaceId}`)
      const data = response?.data
      setSecrets(data)
    } catch (error) {
      console.error("Failed to fetch secrets:", error)
    }
  }

  const fetchWorkspace = async () => {
    try {
      const response = await axiosInstance.current?.get(`/workspaces/${workspaceId}`)
      const data = response?.data
      setWorkspaceName(data.name)
    } catch (error) {
      console.error("Failed to fetch workspace:", error)
    }
  }

  const handleDeleteSecret = (secretId: string) => {
    setSecretToDelete(secretId)
    setOpenConfirmationDialog(true)
  }

  const confirmDeleteSecret = async () => {
    if (secretToDelete) {
      try {
        await axiosInstance.current?.delete(`/secrets/${secretToDelete}`)
        setSecrets((prev) => prev.filter((secret) => secret.id !== secretToDelete))
      } catch (error) {
        console.error("Failed to delete secret:", error)
      } finally {
        setOpenConfirmationDialog(false)
        setSecretToDelete(null)
      }
    }
  }

  const handleEditSecret = (secret: Secret) => {
    setSecretName(secret.name)
    setSecretValue(secret.value)
    setExpiresAt(secret.expires_at ? new Date(secret.expires_at) : null)
    setEditingSecretId(secret.id)
    setOpenModal(true)
  }

  const fetchCreatorUsername = async (userId: string) => {
    try {
      const response = await axiosInstance.current?.get(`/auth/user-id/${userId}`);
      setCreatorUsername(response?.data.username);
    } catch (error) {
      console.error("Failed to fetch creator username:", error);
    }
  };

  const handleOpenSecretModal = (secret: Secret) => {
    setSelectedSecret(secret)
    setOpenSecretModal(true)
    fetchCreatorUsername(secret.created_by)
  }

  const handleCloseSecretModal = () => {
    setOpenSecretModal(false)
    setSelectedSecret(null)
    setShowValue(false)
  }

  const handleCopyToClipboard = (value: string) => {
    navigator.clipboard.writeText(value)
  }

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value)
  }

  const filteredSecrets = secrets.filter((secret) => secret.name.toLowerCase().includes(searchTerm.toLowerCase()))

  const handleToggleExpiration = () => {
    setShowExpiration((prev) => !prev)
  }

  const handleToggleSecretValue = () => {
    setShowSecretValue((prev) => !prev)
  }

  useEffect(() => {
    fetchSecrets()
    fetchWorkspace()
  }, [])

  const handleMenuOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
  }

  return (
    <Box sx={{ py: 4, px: 2, backgroundColor: "#e4eff6", minHeight: "100vh", borderRadius: "5px" }}>
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
              {workspaceName || ""}
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleOpenModal}
            sx={{
              backgroundColor: "#0369a1",
              "&:hover": {
                backgroundColor: "#0284c7",
              },
            }}
          >
            Создать секрет
          </Button>
        </Box>

        <Box sx={{ mb: 4, display: "flex", gap: 2 }}>
          <Button
            variant="contained"
            component={Link}
            to={`/workspaces/${workspaceId}/secrets`}
            sx={{
              backgroundColor: "#0369a1",
              "&:hover": {
                backgroundColor: "#0284c7",
              },
            }}
          >
            Секреты
          </Button>
          <Button variant="outlined" component={Link} to={`/workspaces/${workspaceId}/users`}>
            Пользователи
          </Button>
          <Button variant="outlined" component={Link} to={`/workspaces/${workspaceId}/roles`}>
            Роли
          </Button>
        </Box>

        <TextField
          margin="dense"
          label="Поиск секрета"
          type="text"
          fullWidth
          variant="outlined"
          value={searchTerm}
          onChange={handleSearchChange}
          sx={{ mb: 2 }}
        />

        <List>
          {filteredSecrets.map((secret) => (
            <ListItem
              key={secret.id}
              onClick={() => handleOpenSecretModal(secret)}
              sx={{
                backgroundColor: "white",
                mb: 1,
                borderRadius: "4px",
                "&:hover": {
                  backgroundColor: "#f0f9ff",
                },
              }}
            >
              <ListItemText
                primary={
                  <Typography color="primary" sx={{ cursor: "pointer" }}>
                    {secret.name}
                  </Typography>
                }
                secondary={`Срок действия: ${secret.expires_at ? new Date(secret.expires_at).toLocaleDateString("ru-RU") : "Не установлен"}`}
              />
              <IconButton
                edge="end"
                aria-label="edit"
                onClick={(e) => {
                  e.stopPropagation()
                  handleEditSecret(secret)
                }}
              >
                <EditIcon />
              </IconButton>
              <IconButton
                edge="end"
                aria-label="delete"
                onClick={(e) => {
                  e.stopPropagation()
                  handleDeleteSecret(secret.id)
                }}
              >
                <DeleteIcon />
              </IconButton>
            </ListItem>
          ))}
        </List>

        <Dialog open={openModal} onClose={handleCloseModal}>
          <DialogTitle>{editingSecretId ? "Редактировать секрет" : "Создать секрет"}</DialogTitle>
          <DialogContent>
            <form onSubmit={handleCreateOrUpdateSecret}>
              <TextField
                autoFocus
                margin="dense"
                label="Название"
                type="text"
                fullWidth
                variant="outlined"
                value={secretName}
                onChange={(e) => setSecretName(e.target.value)}
              />
              <TextField
                margin="dense"
                label="Значение"
                type={"text"}
                multiline
                rows={4}
                fullWidth
                variant="outlined"
                value={secretValue}
                onChange={(e) => setSecretValue(e.target.value)}
              />
              <TextField
                margin="dense"
                label="Срок действия (опционально)"
                type="datetime-local"
                fullWidth
                variant="outlined"
                value={expiresAt ? expiresAt.toISOString().slice(0, 16) : ""}
                onChange={(e) => setExpiresAt(e.target.value ? new Date(e.target.value) : null)}
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </form>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseModal}>Отмена</Button>
            <Button onClick={handleCreateOrUpdateSecret} variant="contained" type="submit">
              {editingSecretId ? "Сохранить" : "Создать"}
            </Button>
          </DialogActions>
        </Dialog>

        <ConfirmationDialog open={openConfirmationDialog} onClose={() => setOpenConfirmationDialog(false)}>
          <DialogTitle>Подтверждение удаления</DialogTitle>
          <DialogContent>
            <Typography>Вы уверены, что хотите удалить этот секрет?</Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenConfirmationDialog(false)}>Отмена</Button>
            <Button onClick={confirmDeleteSecret} variant="contained" color="error">
              Удалить
            </Button>
          </DialogActions>
        </ConfirmationDialog>

        <Dialog open={openSecretModal} onClose={handleCloseSecretModal} maxWidth="md" fullWidth>
          <DialogTitle>Детали секрета</DialogTitle>
          <DialogContent>
            <TextField
              margin="dense"
              label="Название"
              type="text"
              fullWidth
              variant="outlined"
              value={selectedSecret?.name}
              InputProps={{
                readOnly: true,
              }}
            />
            <TextField
              margin="dense"
              label="Значение"
              type={showValue ? "text" : "password"}
              multiline
              rows={4}
              fullWidth
              variant="outlined"
              value={selectedSecret?.value}
              InputProps={{
                readOnly: true,
                endAdornment: (
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <IconButton onClick={() => setShowValue(!showValue)} size="small">
                      {showValue ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                    <IconButton onClick={() => handleCopyToClipboard(selectedSecret?.value || "")} size="small">
                      <ContentCopy />
                    </IconButton>
                  </Box>
                ),
              }}
            />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              Срок действия: {selectedSecret?.expires_at ? new Date(selectedSecret.expires_at).toLocaleDateString("ru-RU") : "Нет срока действия"}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Создано: {selectedSecret?.created_at ? new Date(selectedSecret.created_at).toLocaleDateString("ru-RU") : "Нет даты создания"}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Создатель: {creatorUsername || "Неизвестен"}
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseSecretModal}>Закрыть</Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  )
}

export default SecretsPage

