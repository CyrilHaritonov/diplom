import { FC, useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, List, ListItem, ListItemText, IconButton, Typography } from '@mui/material'
import { Edit as EditIcon, Delete as DeleteIcon, Visibility, VisibilityOff, ContentCopy } from '@mui/icons-material'
import { useAxios } from '../utils/hooks';

interface Secret {
  id: string;
  name: string;
  value: string;
  workspace_id: string;
  created_by: string;
  expires_at?: Date | null;
  created_at: Date;
}

interface Workspace {
  id: string;
  name: string;
}

const SecretsPage: FC = () => {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const [openModal, setOpenModal] = useState(false);
  const [secretName, setSecretName] = useState('');
  const [secretValue, setSecretValue] = useState('');
  const [secrets, setSecrets] = useState<Secret[]>([]);
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [editingSecretId, setEditingSecretId] = useState<string | null>(null);
  const [openSecretModal, setOpenSecretModal] = useState(false);
  const [selectedSecret, setSelectedSecret] = useState<Secret | null>(null);
  const [showValue, setShowValue] = useState(false);
  const [workspaceName, setWorkspaceName] = useState<string | null>('');
  const axiosInstance = useAxios(import.meta.env.VITE_API_URL);

  const handleOpenModal = () => {
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setSecretName('');
    setSecretValue('');
    setExpiresAt(null);
    setEditingSecretId(null);
  };

  const handleCreateOrUpdateSecret = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      if (editingSecretId) {
        // Update existing secret
        await axiosInstance.current?.put(`/secrets/${editingSecretId}`, {
          name: secretName,
          value: secretValue,
          expires_at: expiresAt
        });
        // Update the local state
        setSecrets((prev) => prev.map(secret => 
          secret.id === editingSecretId ? { ...secret, name: secretName, value: secretValue, expires_at: expiresAt } : secret
        ));
      } else {
        // Create new secret
        const response = await axiosInstance.current?.post(`/secrets`, {
          name: secretName,
          value: secretValue,
          workspace_id: workspaceId,
          expires_at: expiresAt
        });
        const newSecret = response?.data;
        setSecrets((prev) => [...prev, newSecret]); // Add the new secret to the list
      }
      handleCloseModal(); // Close the modal after creating or updating the secret
    } catch (error) {
      console.error('Failed to create or update secret:', error);
    }
  };

  const fetchSecrets = async () => {
    try {
      const response = await axiosInstance.current?.get(`/secrets/workspace/${workspaceId}`);
      const data = response?.data;
      setSecrets(data); // Set the fetched secrets
    } catch (error) {
      console.error('Failed to fetch secrets:', error);
    }
  };

  const fetchWorkspace = async () => {
    try {
      const response = await axiosInstance.current?.get(`/workspaces/${workspaceId}`);
      const data = response?.data;
      setWorkspaceName(data.name); // Set the workspace name
    } catch (error) {
      console.error('Failed to fetch workspace:', error);
    }
  };

  const handleDeleteSecret = async (secretId: string) => {
    try {
      await axiosInstance.current?.delete(`/secrets/${secretId}`);
      setSecrets((prev) => prev.filter(secret => secret.id !== secretId)); // Remove the deleted secret from the list
    } catch (error) {
      console.error('Failed to delete secret:', error);
    }
  };

  const handleEditSecret = (secret: Secret) => {
    setSecretName(secret.name);
    setSecretValue(secret.value);
    setExpiresAt(secret.expires_at ? new Date(secret.expires_at) : null);
    setEditingSecretId(secret.id);
    setOpenModal(true);
  };

  const handleOpenSecretModal = (secret: Secret) => {
    setSelectedSecret(secret);
    setOpenSecretModal(true);
  };

  const handleCloseSecretModal = () => {
    setOpenSecretModal(false);
    setSelectedSecret(null);
    setShowValue(false);
  };

  const handleCopyToClipboard = (value: string) => {
    navigator.clipboard.writeText(value);
    alert('Секрет скопирован в буфер обмена!');
  };

  useEffect(() => {
    fetchSecrets(); // Fetch secrets when the component mounts
    fetchWorkspace(); // Fetch workspace details
  }, [workspaceId]); // Re-fetch if workspaceId changes

  return (
    <div>
      <h2>Секреты для рабочего пространства: {workspaceName || 'Загрузка...'}</h2>
      
      {/* Link to Roles Page */}
      <Button component={Link} to={`/workspaces/${workspaceId}/secrets`} variant="outlined">
        Управление секретами
      </Button>
      {/* Link to Roles Page */}
      <Button component={Link} to={`/workspaces/${workspaceId}/roles`} variant="outlined">
        Управление ролями
      </Button>
      {/* Link to Users Page */}
      <Button component={Link} to={`/workspaces/${workspaceId}/users`} variant="outlined">
        Управление пользователями
      </Button>
      {/* Button to open the modal */}
      <Button variant="contained" onClick={handleOpenModal}>
        Создать секрет
      </Button>

      {/* Create Secret Modal */}
      <Dialog open={openModal} onClose={handleCloseModal}>
        <DialogTitle>{editingSecretId ? 'Редактировать секрет' : 'Создать секрет'}</DialogTitle>
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
              type="text"
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
              value={expiresAt ? expiresAt.toISOString().slice(0, 16) : ''}
              onChange={(e) => setExpiresAt(e.target.value ? new Date(e.target.value) : null)}
            />
          </form>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseModal}>Отмена</Button>
          <Button onClick={handleCreateOrUpdateSecret} variant="contained" type="submit">
            {editingSecretId ? 'Сохранить' : 'Создать'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Secrets List */}
      <List className="secrets-list">
        {secrets.map(secret => (
          <ListItem key={secret.id} onClick={() => handleOpenSecretModal(secret)}>
            <ListItemText
              primary={<span style={{ color: 'blue', textDecoration: 'underline', cursor: 'pointer' }}>{secret.name}</span>}
              secondary={`Создано: ${new Date(secret.created_at).toLocaleDateString()}`}
            />
            <IconButton 
              edge="end" 
              aria-label="edit"
              onClick={(e) => { e.stopPropagation(); handleEditSecret(secret); }}
            >
              <EditIcon />
            </IconButton>
            <IconButton 
              edge="end" 
              aria-label="delete"
              onClick={(e) => { e.stopPropagation(); handleDeleteSecret(secret.id); }}
            >
              <DeleteIcon />
            </IconButton>
          </ListItem>
        ))}
      </List>

      {/* Secret Detail Modal */}
      <Dialog open={openSecretModal} onClose={handleCloseSecretModal}>
        <DialogTitle>Детали секрета</DialogTitle>
        <DialogContent>
          <p><strong>Название:</strong> {selectedSecret?.name}</p>
          <p>
            <strong>Значение:</strong> {showValue ? selectedSecret?.value : '••••••••••'}
            <Button onClick={() => setShowValue(!showValue)}>
              {showValue ? <VisibilityOff /> : <Visibility />}
            </Button>
            <Button onClick={() => handleCopyToClipboard(selectedSecret?.value || '')}>
              <ContentCopy />
            </Button>
          </p>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseSecretModal}>Закрыть</Button>
        </DialogActions>
      </Dialog>
    </div>
  )
}

export default SecretsPage 