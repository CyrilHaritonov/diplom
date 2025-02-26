"use client"
import { Snackbar } from "@mui/material";
import { type FC, useEffect, useState } from "react"
import { Link } from "react-router-dom"
import {
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  Typography,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  DialogActions,
  Box,
  Dialog as ConfirmationDialog,
} from "@mui/material"
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from "@mui/icons-material"
import { useKeycloak } from "@react-keycloak/web"
import { useAxios } from "../utils/hooks"

interface Workspace {
  id: string
  name: string
  owner_id: string
  created_by: string
  created_at: Date
  color: string
}

// Define the blue shades array
const blueShades = [
  "#3a498d",
  "#506b9b",
  "#76a1b2",
  "#c8d4e4",
  "#f1f4f8"
];

// Function to get color from name
const getColorFromName = (name: string) => {
  // Simple hash function to generate an index from the name
  const hash = Array.from(name).reduce((acc, char) => acc + char.charCodeAt(0), 0);
  // Generate an index based on the hash and the length of the blueShades array
  const index = Math.abs(hash) % blueShades.length; // Ensure the index is within bounds
  return blueShades[index]; // Return the color from the array
}

const WorkspacesPage: FC = () => {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [openDialog, setOpenDialog] = useState(false)
  const [editingWorkspace, setEditingWorkspace] = useState<Workspace | null>(null)
  const [workspaceName, setWorkspaceName] = useState("")
  const [openConfirmationDialog, setOpenConfirmationDialog] = useState(false)
  const [workspaceToDelete, setWorkspaceToDelete] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { keycloak } = useKeycloak()

  const axiosInstance = useAxios(import.meta.env.VITE_API_URL)

  const handleCreateWorkspace = () => {
    setEditingWorkspace(null)
    setWorkspaceName("")
    setOpenDialog(true)
  }

  const handleEditWorkspace = (workspace: Workspace) => {
    setEditingWorkspace(workspace)
    setWorkspaceName(workspace.name)
    setOpenDialog(true)
  }

  const handleCloseSnackbar = () => {
    setErrorMessage(null)
  }

  const handleSaveWorkspace = async () => {
    try {
      if (editingWorkspace) {
        const response = await axiosInstance.current?.put(`/workspaces/${editingWorkspace.id}`, {
          name: workspaceName,
        })
        const updatedWorkspace = response?.data
        setWorkspaces((prev) =>
          prev.map((workspace) => (workspace.id === updatedWorkspace.id ? updatedWorkspace : workspace)),
        )
      } else {
        const response = await axiosInstance.current?.post("/workspaces", {
          name: workspaceName,
        })
        const newWorkspace = response?.data
        const newWorkspaceWithColor = { ...newWorkspace, color: getColorFromName(workspaceName) };
        setWorkspaces((prev) => [...prev, newWorkspaceWithColor])
      }
      setOpenDialog(false)
      fetchWorkspaces()
    } catch (error : any) {
      if (error.response.status === 403) {
        setErrorMessage("У вас нет прав на редактирование пространства.")
      }
      console.error("Failed to save workspace:", error)
    }
  }

  const handleDeleteWorkspace = (workspaceId: string) => {
    setWorkspaceToDelete(workspaceId)
    setOpenConfirmationDialog(true)
  }

  const confirmDeleteWorkspace = async () => {
    if (workspaceToDelete) {
      try {
        await axiosInstance.current?.delete(`/workspaces/${workspaceToDelete}`)
        setWorkspaces((prev) => prev.filter((workspace) => workspace.id !== workspaceToDelete))
      } catch (error) {
        console.error("Failed to delete workspace:", error)
      } finally {
        setOpenConfirmationDialog(false)
        setWorkspaceToDelete(null)
      }
    }
  }

  const fetchWorkspaces = async () => {
    try {
      const response = await axiosInstance.current?.get("/workspaces")
      const data = response?.data.map((workspace: Workspace) => ({
        ...workspace,
        color: getColorFromName(workspace.name), // Assign color based on workspace name
      }))
      setWorkspaces(data)
    } catch (error) {
      console.error("Failed to fetch workspaces:", error)
    }
  }

  useEffect(() => {
    fetchWorkspaces()
  }, [])

  return (
    <Box sx={{ py: 4, px: 2, backgroundColor: "#e4eff6", minHeight: "100vh", borderRadius: "5px" }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 4 }}>
        <Typography variant="h4" component="h1" sx={{ color: "#1e293b", fontWeight: "bold" }}>
          Рабочие пространства
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreateWorkspace}
          sx={{
            backgroundColor: "#0369a1",
            "&:hover": {
              backgroundColor: "#0284c7",
            },
          }}
        >
          Создать
        </Button>
      </Box>

      <Grid container spacing={3}>
        {workspaces.map((workspace) => (
          <Grid item xs={12} sm={6} md={4} key={workspace.id}>
            <Card
              sx={{
                height: "100%",
                display: "flex",
                flexDirection: "column",
                transition: "transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out",
                "&:hover": {
                  transform: "translateY(-5px)",
                  boxShadow: 6,
                },
                overflow: "hidden",
                backgroundColor: workspace.color, // Use the persistent color
              }}
            >
              <Link to={`/workspaces/${workspace.id}/secrets`} style={{ textDecoration: "none", color: "#1e293b" }}>
                <Box sx={{ height: "80px", backgroundColor: workspace.color }} />
                <CardContent sx={{ flexGrow: 1, backgroundColor: "white" }}>
                  <Typography variant="h6" component="h2" gutterBottom>
                    {workspace.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Создано: {new Date(workspace.created_at).toLocaleDateString("ru-RU")}
                  </Typography>
                </CardContent>
              </Link>
              <CardActions sx={{ backgroundColor: "white", justifyContent: "flex-end" }}>
                <IconButton aria-label="edit" onClick={() => handleEditWorkspace(workspace)} sx={{ color: "#0369a1" }}>
                  <EditIcon />
                </IconButton>
                <IconButton
                  aria-label="delete"
                  onClick={() => handleDeleteWorkspace(workspace.id)}
                  sx={{ color: "#e96d6d" }}
                >
                  <DeleteIcon />
                </IconButton>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      <ConfirmationDialog open={openConfirmationDialog} onClose={() => setOpenConfirmationDialog(false)}>
        <DialogTitle>Подтверждение удаления</DialogTitle>
        <DialogContent>
          <Typography>Вы уверены, что хотите удалить это рабочее пространство?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenConfirmationDialog(false)}>Отмена</Button>
          <Button
            onClick={confirmDeleteWorkspace}
            variant="contained"
            sx={{
              backgroundColor: "#e96d6d",
              "&:hover": {
                backgroundColor: "#d9534f",
              },
            }}
          >
            Удалить
          </Button>
        </DialogActions>
      </ConfirmationDialog>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>{editingWorkspace ? "Редактировать пространство" : "Создать пространство"}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Название пространства"
            type="text"
            fullWidth
            variant="outlined"
            value={workspaceName}
            onChange={(e) => setWorkspaceName(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Отмена</Button>
          <Button
            onClick={handleSaveWorkspace}
            variant="contained"
            sx={{
              backgroundColor: "#0369a1",
              "&:hover": {
                backgroundColor: "#0284c7",
              },
            }}
          >
            {editingWorkspace ? "Сохранить" : "Создать"}
          </Button>
        </DialogActions>
      </Dialog>
      <Snackbar
          open={Boolean(errorMessage)}
          autoHideDuration={6000}
          onClose={handleCloseSnackbar}
          message={errorMessage}
        />
    </Box>
  )
}

export default WorkspacesPage

