import { FC, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Button, List, ListItem, ListItemText, IconButton, Dialog, DialogTitle, DialogContent, TextField, DialogActions } from '@mui/material'
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material'
import { useKeycloak } from '@react-keycloak/web';
import { useAxios } from '../utils/hooks';

interface Workspace {
  id: string;
  name: string;
  owner_id: string;
  created_by: string;
  created_at: Date;
}

const WorkspacesPage: FC = () => {
  const { workspaceId } = useParams(); // Cast useParams to RouteParams
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [openDialog, setOpenDialog] = useState(false)
  const [editingWorkspace, setEditingWorkspace] = useState<Workspace | null>(null)
  const [workspaceName, setWorkspaceName] = useState('')
  const { keycloak } = useKeycloak()

  // Use the useAxios hook with the base URL
  const axiosInstance = useAxios(import.meta.env.VITE_API_URL);

  const handleCreateWorkspace = () => {
    setEditingWorkspace(null)
    setWorkspaceName('')
    setOpenDialog(true)
  }

  const handleEditWorkspace = (workspace: Workspace) => {
    setEditingWorkspace(workspace)
    setWorkspaceName(workspace.name)
    setOpenDialog(true)
  }

  const handleSaveWorkspace = async () => {
    try {
      if (editingWorkspace) {
        // Update existing workspace
        const response = await axiosInstance.current?.put(`/workspaces/${editingWorkspace.id}`, {
          name: workspaceName,
        });
        const updatedWorkspace = response?.data;
        setWorkspaces((prev) =>
          prev.map((workspace) =>
            workspace.id === updatedWorkspace.id ? updatedWorkspace : workspace
          )
        );
      } else {
        // Create new workspace
        const response = await axiosInstance.current?.post('/workspaces', {
          name: workspaceName,
        });
        const newWorkspace = response?.data;
        setWorkspaces((prev) => [...prev, newWorkspace]);
      }
      setOpenDialog(false); // Close the dialog after saving
    } catch (error) {
      console.error('Failed to save workspace:', error);
    }
  };

  const handleDeleteWorkspace = async (workspaceId: string) => {
    try {
      // Make the DELETE request to the API
      await axiosInstance.current?.delete(`/workspaces/${workspaceId}`);

      // Update the state to remove the deleted workspace
      setWorkspaces((prev) => prev.filter((workspace) => workspace.id !== workspaceId));
    } catch (error) {
      console.error('Failed to delete workspace:', error);
    }
  };

  const fetchWorkspaces = async () => {
    try {
      const response = await axiosInstance.current?.get('/workspaces');
      const data = response?.data;
      setWorkspaces(data);
    } catch (error) {
      console.error('Failed to fetch workspaces:', error);
    }
  }

  useEffect(() => {
    fetchWorkspaces(); // Call fetchWorkspaces when the component mounts
  }, [keycloak]); // Re-fetch if keycloak changes

  return (
    <div>
      <h1>Рабочие пространства</h1>
      
      {/* Create Workspace Button */}
      <Button 
        variant="contained" 
        startIcon={<AddIcon />}
        onClick={handleCreateWorkspace}
      >
        Создать рабочее пространство
      </Button>

      {/* List of Workspaces */}
      <List className="workspaces-list">
        {workspaces.map(workspace => (
          <ListItem key={workspace.id}>
            <ListItemText
              primary={
                <Link to={`/workspaces/${workspace.id}/secrets`}>
                  {workspace.name}
                </Link>
              }
              secondary={`Создано: ${new Date(workspace.created_at).toLocaleDateString()}`}
            />
            <IconButton 
              edge="end" 
              aria-label="edit"
              onClick={() => handleEditWorkspace(workspace)}
            >
              <EditIcon />
            </IconButton>
            <IconButton 
              edge="end" 
              aria-label="delete"
              onClick={() => handleDeleteWorkspace(workspace.id)}
            >
              <DeleteIcon />
            </IconButton>
          </ListItem>
        ))}
      </List>

      {/* Create/Edit Workspace Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>
          {editingWorkspace ? 'Редактировать пространство' : 'Создать пространство'}
        </DialogTitle>
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
          <Button onClick={handleSaveWorkspace} variant="contained">
            {editingWorkspace ? 'Сохранить' : 'Создать'}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  )
}

export default WorkspacesPage