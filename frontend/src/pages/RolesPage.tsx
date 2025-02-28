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
  Checkbox,
  FormControlLabel,
  Card,
  CardContent,
  CardActions,
  Snackbar,
} from "@mui/material"
import {
  ArrowBack,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
} from "@mui/icons-material"
import { useAxios } from "../utils/hooks"

interface Role {
  id: string
  name: string
  for_workspace: string
  permissions: {
    create: boolean
    read: boolean
    update: boolean
    deletable: boolean
    see_logs: boolean
    give_roles: boolean
    add_users: boolean
    admin_rights: boolean
  }
}

interface RoleWithPermissions extends Role {
  create: boolean
  read: boolean
  update: boolean
  deletable: boolean
  see_logs: boolean
  give_roles: boolean
  add_users: boolean
  admin_rights: boolean
}

interface RoleBinding {
  id: string
  username: string
  user_id: string
}

const RolesPage: FC = () => {
  const { workspaceId } = useParams<{ workspaceId: string }>()
  const navigate = useNavigate()
  const [openModal, setOpenModal] = useState(false)
  const [openUserModal, setOpenUserModal] = useState(false)
  const [openRoleUsersModal, setOpenRoleUsersModal] = useState(false)
  const [roleUsers, setRoleUsers] = useState<RoleBinding[]>([])
  const [roleName, setRoleName] = useState("")
  const [permissions, setPermissions] = useState({
    create: false,
    read: false,
    update: false,
    deletable: false,
    see_logs: false,
    give_roles: false,
    add_users: false,
    admin_rights: false,
  })
  const [roles, setRoles] = useState<RoleWithPermissions[]>([])
  const [users, setUsers] = useState<RoleBinding[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null)
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null)
  const [workspaceName, setWorkspaceName] = useState<string | null>("")
  const axiosInstance = useAxios(import.meta.env.VITE_API_URL)
  const [roleBindings, setRoleBindings] = useState<RoleBinding[] | null> (null)
  const [openConfirmationDialog, setOpenConfirmationDialog] = useState(false)
  const [roleIdToDelete, setRoleIdToDelete] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const rightsMapping: { [key: string]: string } = {
    create: "Создавать",
    read: "Читать",
    update: "Обновлять",
    deletable: "Удалять",
    see_logs: "Смотреть логи",
    give_roles: "Управлять ролями",
    add_users: "Управлять пользователями",
    admin_rights: "Управление пространством",
  };
  
  const handleOpenModal = () => {
    setOpenModal(true)
  }

  const handleCloseModal = () => {
    setOpenModal(false)
    setRoleName("")
    setPermissions({
      create: false,
      read: false,
      update: false,
      deletable: false,
      see_logs: false,
      give_roles: false,
      add_users: false,
      admin_rights: false,
    })
    setEditingRoleId(null)
  }

  const handleCreateRole = async (event: React.FormEvent) => {
    event.preventDefault()
    try {
      const response = await axiosInstance.current?.post(`/roles`, {
        name: roleName,
        for_workspace: workspaceId,
        ...permissions, // This will still contain English names
      })
      const newRole = response?.data
      setRoles((prev) => [...prev, newRole])
      handleCloseModal()
    } catch (error: any) {
      if (error.response && error.response.status === 403) {
        setErrorMessage("У вас нет прав на создание роли.")
      } else {
        console.error("Failed to create role:", error)
      }
    }
  }

  const fetchRoles = useCallback(async () => {
    try {
      const response = await axiosInstance.current?.get(`/roles?workspace_id=${workspaceId}`)
      const data = response?.data
      setRoles(data)
    } catch (error) {
      console.error("Failed to fetch roles:", error)
    }
  }, [axiosInstance, workspaceId])

  const fetchWorkspace = useCallback(async () => {
    try {
      const response = await axiosInstance.current?.get(`/workspaces/${workspaceId}`)
      const data = response?.data
      setWorkspaceName(data.name)
    } catch (error) {
      console.error("Failed to fetch workspace:", error)
    }
  }, [axiosInstance, workspaceId])

  const handleEditRole = async (roleId: string) => {
    const roleToEdit = roles.find((role) => role.id === roleId)
    if (roleToEdit) {
      setRoleName(roleToEdit.name)
      setPermissions({
        create: roleToEdit.create,
        read: roleToEdit.read,
        update: roleToEdit.update,
        deletable: roleToEdit.deletable,
        see_logs: roleToEdit.see_logs,
        give_roles: roleToEdit.give_roles,
        add_users: roleToEdit.add_users,
        admin_rights: roleToEdit.admin_rights,
      })
      setEditingRoleId(roleId)
      handleOpenModal()
    }
  }

  const handleUpdateRole = async (roleId: string) => {
    try {
      await axiosInstance.current?.put(`/roles/${roleId}`, {
        name: roleName,
        ...permissions,
      })
      setRoles((prev) => prev.map((role) => (role.id === roleId ? { ...role, name: roleName, ...permissions } : role)))
      handleCloseModal()
    } catch (error: any) {
      if (error.response.status === 403) {
        setErrorMessage("У вас нет прав на редактирование ролей.")
      }
      console.error("Failed to update role:", error)
    }
  }

  const handleDeleteRole = (roleId: string) => {
    setRoleIdToDelete(roleId)
    setOpenConfirmationDialog(true)
  }

  const confirmDeleteRole = async () => {
    if (roleIdToDelete) {
      try {
        await axiosInstance.current?.delete(`/roles/${roleIdToDelete}`)
        fetchRoles()
      } catch (error) {
        console.error("Failed to delete role:", error)
      } finally {
        setOpenConfirmationDialog(false)
        setRoleIdToDelete(null)
      }
    }
  }

  const handleCloseConfirmationDialog = () => {
    setOpenConfirmationDialog(false)
    setRoleIdToDelete(null)
  }

  const handleCloseUserModal = () => {
    setOpenUserModal(false)
    setSearchTerm("")
  }

  const handleOpenRoleUsersModal = (roleId: string) => {
    setSelectedRoleId(roleId)
    fetchUsersByRole(roleId)
    setOpenRoleUsersModal(true)
  }

  const handleCloseRoleUsersModal = () => {
    setOpenRoleUsersModal(false)
  }

  const fetchUsersByRole = async (roleId: string) => {
    try {
      const response = await axiosInstance.current?.get(`/role-bindings/role/${roleId}/workspace/${workspaceId}`)
      const data = response?.data
      const data_with_usernames = data.map((roleBinding: any) => {
        const user = users.find((u: RoleBinding) => u.id === roleBinding.user_id)
        return {
          id: roleBinding.id,
          user_id: roleBinding.user_id,
          username: user ? user.username : "",
        }
      })

      setRoleUsers(data_with_usernames)
    } catch (error) {
      console.error("Failed to fetch users for the role:", error)
    }
  }

  const fetchUsers = useCallback(async () => {
    try {
      const response = await axiosInstance.current?.get(`/auth/users`)
      const workspaceUsersResponse = await axiosInstance.current?.get(`/workspace-users?workspace_id=${workspaceId}`)
      const workspaceUserIds = workspaceUsersResponse?.data.map((user: any) => user.user_id) || []
      const data = response?.data
      const filteredData = data.filter((user: any) => workspaceUserIds.includes(user.id))
      setUsers(filteredData)
    } catch (error) {
      console.error("Failed to fetch users:", error)
    }
  }, [axiosInstance])

  const fetchRoleBindingsByRole = async (roleId: string) => {
    try {
      const response = await axiosInstance.current?.get(`/role-bindings/role/${roleId}/workspace/${workspaceId}`);
      const roleBindings = response?.data;
      setRoleBindings(roleBindings);
    } catch (error) {
      console.error("Failed to fetch role bindings for the role:", error);
    }
  }

  
  const handleAssignRoleToUser = async (roleId: string) => {
    fetchRoleBindingsByRole(roleId)
    setOpenUserModal(true)
    setSelectedRoleId(roleId)
  }

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value)
  }

  const filteredUsers = users.filter((user) => user.username.toLowerCase().includes(searchTerm.toLowerCase()))

  const handleUserAssign = async (userId: string) => {
    try {
      await axiosInstance.current?.post(`/role-bindings`, { role_id: selectedRoleId, user_id: userId })
      handleCloseUserModal()
    } catch (error) {
      console.error("Failed to assign role to user:", error)
    }
  }

  const handleUserRemove = async (roleBindingId: string) => {
    try {
      await axiosInstance.current?.delete(`/role-bindings/${roleBindingId}`)
      // Refresh the role users after removal
      fetchUsersByRole(selectedRoleId!)
    } catch (error) {
      console.error("Failed to remove user from role:", error)
    }
  }

  useEffect(() => {
    fetchRoles()
    fetchUsers()
    fetchWorkspace()
  }, [fetchRoles, fetchWorkspace, fetchUsers])

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
            Создать роль
          </Button>
        </Box>

        <Box sx={{ mb: 4, display: "flex", gap: 2 }}>
          <Button variant="outlined" component={Link} to={`/workspaces/${workspaceId}/secrets`}>
            Секреты
          </Button>
          <Button variant="outlined" component={Link} to={`/workspaces/${workspaceId}/users`}>
            Пользователи
          </Button>
          <Button
            variant="contained"
            component={Link}
            to={`/workspaces/${workspaceId}/roles`}
            sx={{
              backgroundColor: "#0369a1",
              "&:hover": {
                backgroundColor: "#0284c7",
              },
            }}
          >
            Роли
          </Button>
          <Button variant="outlined" component={Link} to={`/workspaces/${workspaceId}/notifications`}>
            Уведомления
          </Button>
        </Box>

        <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 3 }}>
          {roles.length ? roles.map((role) => (
            <Card key={role.id} sx={{ display: "flex", flexDirection: "column" }}>
              <CardContent>
                <Typography variant="h6" component="h2" gutterBottom>
                  {role.name}
                </Typography>
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Права:
                  </Typography>
                  <ul style={{ paddingLeft: "20px", margin: 0 }}>
                    {[
                      ["Создавать секреты", role.create],
                      ["Читать секреты", role.read],
                      ["Обновлять секреты", role.update],
                      ["Удалять секреты", role.deletable],
                      ["Смотреть логи", role.see_logs],
                      ["Управлять ролями", role.give_roles],
                      ["Управлять пользователями", role.add_users],
                      ["Управление пространством", role.admin_rights],
                    ]
                      .filter(([_, value]) => value)
                      .map(([permission, _]) => (
                        <li key={permission as string}>
                          <Typography variant="body2" sx={{ color: "text.secondary" }}>
                            {permission}
                          </Typography>
                        </li>
                      ))}
                  </ul>
                </Box>
              </CardContent>
              <CardActions sx={{ mt: "auto", justifyContent: "space-between" }}>
                <Button
                  color="primary"
                  size="small"
                  onClick={() => handleAssignRoleToUser(role.id)}
                  sx={{ mr: 1 }}
                >
                  Назначить пользователю
                </Button>
                <Box>
                  <IconButton onClick={() => handleOpenRoleUsersModal(role.id)} size="small" title="Пользователи" color="primary">
                    <PersonIcon />
                  </IconButton>
                  <IconButton onClick={() => handleEditRole(role.id)} size="small" title="Редактировать" color="primary">
                    <EditIcon />
                  </IconButton>
                  <IconButton onClick={() => handleDeleteRole(role.id)} size="small" title="Удалить" sx={{ color: "#e96d6d" }}>
                    <DeleteIcon />
                  </IconButton>
                </Box>
              </CardActions>
            </Card>
          )) : <Box sx={{ mt: 30, gridColumn: "span 3", textAlign: "center" }}>
            <Typography variant="subtitle1" sx={{ color: "text.primary" }} gutterBottom>
              В пространстве нет ролей, либо у вас нет прав на просмотр ролей.
              </Typography>
              </Box>}
        </Box>

        <Dialog open={openModal} onClose={handleCloseModal}>
          <DialogTitle>{editingRoleId ? "Редактировать роль" : "Создать роль"}</DialogTitle>
          <DialogContent>
            <form onSubmit={handleCreateRole}>
              <TextField
                autoFocus
                margin="dense"
                label="Название роли"
                type="text"
                fullWidth
                variant="outlined"
                value={roleName}
                onChange={(e) => setRoleName(e.target.value)}
              />
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Права:
                </Typography>
                {Object.keys(rightsMapping).map((key) => (
                <FormControlLabel
                  key={key}
                  control={
                    <Checkbox
                      checked={permissions[key as keyof typeof permissions]}
                      onChange={(e) => setPermissions({ ...permissions, [key]: e.target.checked })}
                    />
                    }
                  label={rightsMapping[key]} // Display Russian names
                />
                ))}
              </Box>
            </form>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseModal}>Отмена</Button>
            <Button
              onClick={editingRoleId ? () => handleUpdateRole(editingRoleId) : handleCreateRole}
              variant="contained"
              type="submit"
            >
              {editingRoleId ? "Сохранить" : "Создать роль"}
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog open={openUserModal} onClose={handleCloseUserModal}>
          <DialogTitle>Назначить роль</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Поиск пользователя"
              type="text"
              fullWidth
              variant="outlined"
              value={searchTerm}
              onChange={handleSearchChange}
            />
            <List>
              {filteredUsers
              .filter(user => {
                return !roleBindings?.map(roleBinding => roleBinding.user_id)?.includes(user.id)})
              .map((user) => (
                <ListItem key={user.id}>
                  <ListItemText primary={user.username} />
                  <Button variant="outlined" onClick={() => handleUserAssign(user.id)}>
                    Назначить
                  </Button>
                </ListItem>
              ))}
            </List>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseUserModal}>Закрыть</Button>
          </DialogActions>
        </Dialog>

        <Dialog open={openRoleUsersModal} onClose={handleCloseRoleUsersModal}>
          <DialogTitle>Пользователи роли</DialogTitle>
          <DialogContent>
            <List>
              {roleUsers.length ? roleUsers.map((roleBinding) => (
                <ListItem key={roleBinding.user_id}>
                  <ListItemText primary={roleBinding.username} />
                  <Button variant="outlined" onClick={() => handleUserRemove(roleBinding.id)}>
                    Удалить
                  </Button>
                </ListItem>
              )) : "Нет пользователей"}
            </List>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseRoleUsersModal}>Закрыть</Button>
          </DialogActions>
        </Dialog>

        <Dialog open={openConfirmationDialog} onClose={handleCloseConfirmationDialog}>
          <DialogTitle>Подтверждение удаления</DialogTitle>
          <DialogContent>
            <Typography>Вы уверены, что хотите удалить эту роль?</Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseConfirmationDialog}>Отмена</Button>
            <Button onClick={confirmDeleteRole} variant="contained" color="error">
              Удалить
            </Button>
          </DialogActions>
        </Dialog>

        <Snackbar
          open={Boolean(errorMessage)}
          autoHideDuration={6000}
          onClose={() => setErrorMessage(null)}
          message={errorMessage}
        />
      </Container>
    </Box>
  )
}

export default RolesPage

