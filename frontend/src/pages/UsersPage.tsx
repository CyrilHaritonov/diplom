"use client"

import type React from "react"

import { type FC, useState, useEffect, useCallback } from "react"
import { Link, useParams, useNavigate } from "react-router-dom"
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
  Container,
  Snackbar,
} from "@mui/material"
import { ArrowBack, Add as AddIcon, Delete as DeleteIcon } from "@mui/icons-material"
import { useAxios } from "../utils/hooks"

interface User {
  id: string
  user_id: string
  name: string
  username: string
  roles?: string[]
}

interface Role {
  id: string
  name: string
}

interface RoleBinding {
  id: string
  name: string
}

const UsersPage: FC = () => {
  const { workspaceId } = useParams<{ workspaceId: string }>()
  const navigate = useNavigate()
  const [users, setUsers] = useState<User[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [openModal, setOpenModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [userName, setUserName] = useState("")
  const [openRoleModal, setOpenRoleModal] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [workspaceName, setWorkspaceName] = useState<string | null>("")
  const axiosInstance = useAxios(import.meta.env.VITE_API_URL)
  const [openRolesModal, setOpenRolesModal] = useState(false)
  const [rolesList, setRolesList] = useState<RoleBinding[]>([])
  const [openConfirmationDialog, setOpenConfirmationDialog] = useState(false)
  const [userIdToDelete, setUserIdToDelete] = useState<string | null>(null)

  const fetchUsers = useCallback(async () => {
    try {
      const response = await axiosInstance.current?.get(`/workspace-users/?workspace_id=${workspaceId}`)
      const data = response?.data
      const usernameResponse = await axiosInstance.current?.get(`/auth/users`)
      const usernameData = usernameResponse?.data
      const combinedData = data.map((user: User) => {
        const usernameInfo = usernameData.find((u: User) => u.id === user.user_id)
        return {
          ...user,
          username: usernameInfo ? usernameInfo.username : null,
        }
      })
      setUsers(combinedData)
    } catch (error) {
      console.error("Failed to fetch users:", error)
    }
  }, [axiosInstance, workspaceId])

  const fetchRoles = async () => {
    try {
      const response = await axiosInstance.current?.get(`/roles?workspace_id=${workspaceId}`)
      const data = response?.data
      console.log(data);
      setRoles(data)
    } catch (error) {
      console.error("Failed to fetch roles:", error)
    }
  }

  const fetchWorkspace = useCallback(async () => {
    try {
      const response = await axiosInstance.current?.get(`/workspaces/${workspaceId}`)
      const data = response?.data
      setWorkspaceName(data.name)
    } catch (error) {
      console.error("Failed to fetch workspace:", error)
    }
  }, [axiosInstance, workspaceId])

  const handleOpenModal = (selectedUser: User| null = null) => {
    setSelectedUser(selectedUser)
    if (selectedUser) {
      const userToEdit = users.find((user) => user.id === selectedUser.id)
      if (userToEdit) {
        setUserName(userToEdit.name)
      }
    } else {
      setUserName("")
    }
    setOpenModal(true)
  }

  const handleCloseModal = () => {
    setOpenModal(false)
    setUserName("")
    setSelectedUser(null)
    setErrorMessage(null)
  }

  const handleRoleListing = async (user: User) => {
    try {
      console.log(user);
      const response = await axiosInstance.current?.get(`/role-bindings/user/${user.user_id}/workspace/${workspaceId}`);
      const data = response?.data;
      setRolesList(data.map((role_binding: { id: string, role: {name: string} }) => {
        return {
          id: role_binding.id, 
          name: role_binding.role.name
        }
      }));
      setOpenRolesModal(true);
    } catch (error) {
      console.error("Failed to fetch roles:", error);
    }
  };

  const handleDeleteRole = async (roleBinding: RoleBinding) => {
    try {
      await axiosInstance.current?.delete(`/role-bindings/${roleBinding.id}`);
      setRolesList((prev) => prev.filter((item) => item.id !== roleBinding.id));
      fetchUsers();
    } catch (error: any) {
      if (error.response && error.response.status === 403) {
        setErrorMessage("У вас нет прав для удаления роли.");
      } else {
        console.error("Failed to delete role:", error);
      }
    }
  }

  const handleCloseRolesModal = () => {
    setOpenRolesModal(false);
    setRolesList([]);
  };

  const handleSaveUser = async (event: React.FormEvent) => {
    event.preventDefault()
    try {
      if (selectedUser) {
        await axiosInstance.current?.put(`/workspace-users`, { name: userName })
      } else {
        const response = await axiosInstance.current?.get(`/auth/user/${userName}`)
        const userId = response?.data?.userId
        await axiosInstance.current?.post(`/workspace-users`, { user_id: userId, workspace_id: workspaceId })
      }
      fetchUsers()
      handleCloseModal()
    } catch (error : any) {
      if (error.response && error.response.status === 403) {
        setErrorMessage("У вас нет прав на добавление пользователя.")
      } else if (error.response.status === 404) {
        setErrorMessage("Пользователь не найден.")
      } else if (error.response.status === 500) {
        setErrorMessage("Пользователь уже добавлен в пространство.")
      }
      else {
        console.error("Failed to save user:", error)
      }
    }
  }

  const handleRoleAssignment = (selectedUser: User) => {
    setSelectedUser(selectedUser)
    fetchRoles()
    setOpenRoleModal(true)
  }

  const handleCloseRoleModal = () => {
    setOpenRoleModal(false)
    setSelectedUser(null)
  }

  const handleAssignRole = async (roleId: string) => {
    try {
      await axiosInstance.current?.post(`/role-bindings`, { role_id: roleId, user_id: selectedUser?.user_id })
      fetchUsers()
      handleCloseRoleModal()
    } catch (error: any) {
      if (error.response && error.response.status === 403) {
        setErrorMessage("У вас нет прав для назначения роли.");
      } else {
        console.error("Failed to assign role:", error);
      }
    }
  }

  const handleDeleteUser = (userId: string) => {
    setUserIdToDelete(userId)
    setOpenConfirmationDialog(true)
  }

  const confirmDeleteUser = async () => {
    if (userIdToDelete) {
      try {
        await axiosInstance.current?.delete(`/workspace-users/${userIdToDelete}`);
        fetchUsers();
      } catch (error: any) {
        if (error.response && error.response.status === 403) {
          setErrorMessage("У вас нет прав для удаления пользователя.");
        } else {
          console.error("Failed to delete user:", error);
        }
      } finally {
        setOpenConfirmationDialog(false);
        setUserIdToDelete(null);
      }
    }
  }
  const handleCloseConfirmationDialog = () => {
    setOpenConfirmationDialog(false)
    setUserIdToDelete(null)
  }

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value)
  }

  const filteredUsers = users.filter((user) => user.username.toLowerCase().includes(searchTerm.toLowerCase()))

  const handleCloseSnackbar = () => {
    setErrorMessage(null)
  }

  useEffect(() => {
    fetchUsers()
    fetchWorkspace()
  }, [fetchUsers, fetchWorkspace])

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
            onClick={() => handleOpenModal()}
            sx={{
              backgroundColor: "#0369a1",
              "&:hover": {
                backgroundColor: "#0284c7",
              },
            }}
          >
            Добавить пользователя
          </Button>
        </Box>

        <Box sx={{ mb: 4, display: "flex", gap: 2 }}>
          <Button variant="outlined" component={Link} to={`/workspaces/${workspaceId}/secrets`}>
            Секреты
          </Button>
          <Button
            variant="contained"
            component={Link}
            to={`/workspaces/${workspaceId}/users`}
            sx={{
              backgroundColor: "#0369a1",
              "&:hover": {
                backgroundColor: "#0284c7",
              },
            }}
          >
            Пользователи
          </Button>
          <Button variant="outlined" component={Link} to={`/workspaces/${workspaceId}/roles`}>
            Роли
          </Button>
        </Box>

        <TextField
          margin="dense"
          label="Поиск пользователя"
          type="text"
          fullWidth
          variant="outlined"
          value={searchTerm}
          onChange={handleSearchChange}
          sx={{ mb: 2 }}
        />

        <List>
          {filteredUsers.length ? filteredUsers.map((user) => (
            <ListItem
              key={user.id}
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
                  <Typography color="primary" sx={{ fontWeight: "bold" }}>
                    {user.username}
                  </Typography>
                }
                secondary={`Роли: ${user.roles?.join(", ") || "Нет ролей"}`}
              />
              <Box>
                <Button color="primary" size="small" onClick={() => handleRoleAssignment(user)} sx={{ mr: 1 }}>
                  Назначить роль
                </Button>
                <Button color="secondary" size="small" onClick={() => handleRoleListing(user)} sx={{ mr: 1 }}>
                  Отозвать роль
                </Button>                
                <Button color="error" size="small" onClick={() => handleDeleteUser(user.id)}>
                  Исключить
                </Button>
              </Box>
            </ListItem>
          )) : <Box sx={{ mt: 30, gridColumn: "span 3", textAlign: "center" }}>
            <Typography variant="subtitle1" sx={{ color: "text.primary" }} gutterBottom>
              В пространстве нет пользователей, либо у вас нет прав на просмотр пользователей.
              </Typography>
              </Box>}
        </List>

        <Dialog open={openModal} onClose={handleCloseModal}>
          <DialogTitle>{selectedUser ? "Редактировать пользователя" : "Добавить пользователя"}</DialogTitle>
          <DialogContent>
            <form onSubmit={handleSaveUser}>
              <TextField
                autoFocus
                margin="dense"
                label="Имя пользователя"
                type="text"
                fullWidth
                variant="outlined"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
              />
            </form>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseModal}>Отмена</Button>
            <Button onClick={handleSaveUser} variant="contained" type="submit">
              {selectedUser ? "Сохранить" : "Добавить"}
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog open={openRoleModal} onClose={handleCloseRoleModal}>
          <DialogTitle>Назначить роль</DialogTitle>
          <DialogContent>
            <List>
              {roles
              .filter(role => !selectedUser?.roles?.includes(role.name))
              .map((role) => (
                <ListItem key={role.id}>
                  <ListItemText primary={role.name} />
                  <Button variant="outlined" onClick={() => handleAssignRole(role.id)} sx={{ml: 5}}>
                    Назначить
                  </Button>
                </ListItem>
              ))}
            </List>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseRoleModal}>Закрыть</Button>
          </DialogActions>
        </Dialog>

        <Dialog open={openRolesModal} onClose={handleCloseRolesModal}>
          <DialogTitle>Роли пользователя</DialogTitle>
          <DialogContent>
            <List>
              {rolesList.length > 0 ? (
                rolesList.map((role) => (
                  <ListItem key={role.id} sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <ListItemText primary={role.name} />
                    <IconButton onClick={() => handleDeleteRole(role)} size="small" color="error">
                      <DeleteIcon />
                    </IconButton>
                  </ListItem>
                ))
              ) : (
                <Typography variant="body2">Нет назначенных ролей.</Typography>
              )}
            </List>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseRolesModal}>Закрыть</Button>
          </DialogActions>
        </Dialog>

        <Dialog open={openConfirmationDialog} onClose={handleCloseConfirmationDialog}>
          <DialogTitle>Подтверждение удаления</DialogTitle>
          <DialogContent>
            <Typography>Вы уверены, что хотите удалить этого пользователя?</Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseConfirmationDialog}>Отмена</Button>
            <Button onClick={confirmDeleteUser} variant="contained" color="error">
              Удалить
            </Button>
          </DialogActions>
        </Dialog>

        <Snackbar
          open={Boolean(errorMessage)}
          autoHideDuration={6000}
          onClose={handleCloseSnackbar}
          message={errorMessage}
        />
      </Container>
    </Box>
  )
}

export default UsersPage

