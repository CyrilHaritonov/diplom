import { Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, List, ListItem, ListItemText } from '@mui/material';
import { FC, useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAxios } from '../utils/hooks';

interface User {
  id: string;
  user_id: string;
  name: string;
  username: string;
  roles?: string[]; // Add roles property to store user roles
}

interface Role {
  id: string;
  role: {
    name: string
  }
}

const UsersPage: FC = () => {
  const { workspaceId } = useParams();
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [openModal, setOpenModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState('');
  const [openRoleModal, setOpenRoleModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState(''); // State for search term
  const axiosInstance = useAxios(import.meta.env.VITE_API_URL);

  const fetchUsers = async () => {
    try {
      const response = await axiosInstance.current?.get(`/workspace-users/?workspace_id=${workspaceId}`);
      const data = response?.data;
      const usernameResponse = await axiosInstance.current?.get(`/auth/users`);
      const usernameData = usernameResponse?.data;
      const combinedData = data.map((user: User) => {
        const usernameInfo = usernameData.find((u: User) => u.id === user.user_id);
        return {
          ...user,
          username: usernameInfo ? usernameInfo.username : null // Add username field
        };
      });
      setUsers(combinedData); // Set the fetched users with usernames
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  };

  const fetchRoles = async () => {
    try {
      const response = await axiosInstance.current?.get(`/roles?workspace_id=${workspaceId}`);
      const data = response?.data;
      setRoles(data); // Set the fetched roles
    } catch (error) {
      console.error('Failed to fetch roles:', error);
    }
  };

  const handleOpenModal = (userId: string | null = null) => {
    setSelectedUserId(userId);
    if (userId) {
      const userToEdit = users.find(user => user.id === userId);
      if (userToEdit) {
        setUserName(userToEdit.name);
      }
    } else {
      setUserName('');
    }
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setUserName('');
    setSelectedUserId(null);
  };

  const handleSaveUser = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      if (selectedUserId) {
        // Update existing user
        await axiosInstance.current?.put(`/workspace-users`, { name: userName });
      } else {
        const responce = await axiosInstance.current?.get(`/auth/user/${userName}`);
        const userId = responce?.data?.userId;
        // Create new user
        await axiosInstance.current?.post(`/workspace-users`, { user_id: userId, workspace_id: workspaceId });
      }
      fetchUsers(); // Refresh the user list
      handleCloseModal(); // Close the modal after saving
    } catch (error) {
      setErrorMessage('User not found, please check the username.');
      console.error('Failed to save user:', error);
    }
  };

  const handleRoleAssignment = (userId: string) => {
    setSelectedUserId(userId);
    fetchRoles(); // Fetch roles when opening the modal
    setOpenRoleModal(true);
  };

  const handleCloseRoleModal = () => {
    setOpenRoleModal(false);
    setSelectedUserId(null);
  };

  const handleAssignRole = async (roleId: string) => {
    try {
      await axiosInstance.current?.post(`/role-bindings`, { role_id: roleId, user_id: selectedUserId });
      fetchUsers(); // Refresh the user list after assigning the role
      handleCloseRoleModal(); // Close the role assignment modal
    } catch (error) {
      console.error('Failed to assign role:', error);
    }
  };

  const handleDeleteUser = async (workspace_user_id: string) => {
    try {
      await axiosInstance.current?.delete(`/workspace-users/${workspace_user_id}`);
      fetchUsers(); // Refresh the user list after deletion
    } catch (error) {
      console.error('Failed to delete user:', error);
    }
  };

  // New search handler
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  // Filter users based on the search term
  const filteredUsers = users.filter(user =>
    user.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    fetchUsers(); // Fetch users when the component mounts
    console.log(users);
  }, [workspaceId]); // Re-fetch if workspaceId changes

  return (
    <div>
      <h2>Пользователи рабочего пространства</h2>
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
      <Button variant="contained" onClick={() => handleOpenModal()}>Добавить пользователя</Button>

      {/* Search Bar */}
      <TextField
        margin="dense"
        label="Поиск пользователя"
        type="text"
        fullWidth
        variant="outlined"
        value={searchTerm}
        onChange={handleSearchChange}
      />

      {/* Users List */}
      <div className="users-list">
        {filteredUsers.map(user => (
          <div key={user.id} className="user-item">
            <h4>{user.username}</h4>
            <p>Роли: {user.roles?.join(', ') || 'Нет ролей'}</p> {/* Display user roles */}
            <Button variant="outlined" onClick={() => handleRoleAssignment(user.user_id)}>Назначить роль</Button>
            <Button variant="outlined" onClick={() => handleDeleteUser(user.id)}>Удалить</Button>
          </div>
        ))}
      </div>

      {/* User Modal */}
      <Dialog open={openModal} onClose={handleCloseModal}>
        <DialogTitle>{selectedUserId ? 'Редактировать пользователя' : 'Добавить пользователя'}</DialogTitle>
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
          <p>{errorMessage}</p>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseModal}>Отмена</Button>
          <Button onClick={handleSaveUser} variant="contained" type="submit">
            {selectedUserId ? 'Сохранить' : 'Добавить'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Role Assignment Modal */}
      <Dialog open={openRoleModal} onClose={handleCloseRoleModal}>
        <DialogTitle>Назначить роль</DialogTitle>
        <DialogContent>
          <h4>Выберите роль для пользователя:</h4>
          <List>
            {roles.map(role => (
              <ListItem key={role.id}>
                <ListItemText primary={role.role.name} />
                <Button variant="outlined" onClick={() => handleAssignRole(role.id)}>Назначить</Button>
              </ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseRoleModal}>Закрыть</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default UsersPage; 