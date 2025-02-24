import { Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, List, ListItem, ListItemText } from '@mui/material';
import { FC, useState, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAxios } from '../utils/hooks';

interface Role {
  id: string;
  name: string;
  for_workspace: string;
  permissions: {
    create: boolean;
    read: boolean;
    update: boolean;
    deletable: boolean;
    see_logs: boolean;
    give_roles: boolean;
    add_users: boolean;
    admin_rights: boolean;
  };
}

interface RoleWithPermissions {
  id: string;
  name: string;
  for_workspace: string;
  create: boolean;
  read: boolean;
  update: boolean;
  deletable: boolean;
  see_logs: boolean;
  give_roles: boolean;
  add_users: boolean;
  admin_rights: boolean;
}

interface RoleBinding {
  id: string;
  username: string;
  user_id: string;
}

const RolesPage: FC = () => {
  const { workspaceId } = useParams()
  const [openModal, setOpenModal] = useState(false);
  const [openUserModal, setOpenUserModal] = useState(false);
  const [openRoleUsersModal, setOpenRoleUsersModal] = useState(false);
  const [roleUsers, setRoleUsers] = useState<RoleBinding[]>([]);
  const [roleName, setRoleName] = useState('');
  const [permissions, setPermissions] = useState({
    create: false,
    read: false,
    update: false,
    deletable: false,
    see_logs: false,
    give_roles: false,
    add_users: false,
    admin_rights: false,
  });
  const [roles, setRoles] = useState<RoleWithPermissions[]>([]);
  const [users, setUsers] = useState<RoleBinding[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);
  const axiosInstance = useAxios(import.meta.env.VITE_API_URL);

  const handleOpenModal = () => {
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setRoleName('');
    setPermissions({
      create: false,
      read: false,
      update: false,
      deletable: false,
      see_logs: false,
      give_roles: false,
      add_users: false,
      admin_rights: false,
    });
    setEditingRoleId(null);
  };

  const handleCreateRole = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      const response = await axiosInstance.current?.post(`/roles`, {
        name: roleName,
        for_workspace: workspaceId,
        ...permissions
      });
      const newRole = response?.data;
      setRoles((prev) => [...prev, newRole]); // Add the new role to the list
      handleCloseModal(); // Close the modal after creating the role
    } catch (error) {
      console.error('Failed to create role:', error);
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

  const handleEditRole = async (roleId: string) => {
    const roleToEdit = roles.find(role => role.id === roleId);
    if (roleToEdit) {
      setRoleName(roleToEdit.name);
      setPermissions({
        create: roleToEdit.create,
        read: roleToEdit.read,
        update: roleToEdit.update,
        deletable: roleToEdit.deletable,
        see_logs: roleToEdit.see_logs,
        give_roles: roleToEdit.give_roles,
        add_users: roleToEdit.add_users,
        admin_rights: roleToEdit.admin_rights,
    });
      setEditingRoleId(roleId);
      handleOpenModal();
    }
  };

  const handleUpdateRole = async (roleId: string) => {
    try {
      await axiosInstance.current?.put(`/roles/${roleId}`, {
        name: roleName,
        ...permissions,
      });
      setRoles((prev) => prev.map(role => 
        role.id === roleId ? { ...role, name: roleName, ...permissions } : role
      ));
      handleCloseModal(); // Close the modal after updating the role
    } catch (error) {
      console.error('Failed to update role:', error);
    }
  };

  const handleDeleteRole = async (roleId: string) => {
    try {
      await axiosInstance.current?.delete(`/roles/${roleId}`);
      setRoles((prev) => prev.filter(role => role.id !== roleId)); // Remove the deleted role from the list
    } catch (error) {
      console.error('Failed to delete role:', error);
    }
  };

  const handleCloseUserModal = () => {
    setOpenUserModal(false);
    setSearchTerm('');
  };

  const handleOpenRoleUsersModal = (roleId: string) => {
    setSelectedRoleId(roleId);
    fetchUsersByRole(roleId);
    setOpenRoleUsersModal(true);
  };

  const handleCloseRoleUsersModal = () => {
    setOpenRoleUsersModal(false);
  };

  const fetchUsersByRole = async (roleId: string) => {
    try {
      const response = await axiosInstance.current?.get(`/role-bindings/role/${roleId}/workspace/${workspaceId}`);
      const data = response?.data;
      const data_with_usernames = data.map((roleBinding: any) => {
        const user = users.find((u: RoleBinding) => u.id === roleBinding.user_id);
        return {
          id: roleBinding.id,
          user_id: roleBinding.user_id,
          username: user ? user.username : '',
        };
      });

      setRoleUsers(data_with_usernames);
    } catch (error) {
      console.error('Failed to fetch users for the role:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await axiosInstance.current?.get(`/auth/users`);
      const data = response?.data;
      setUsers(data); // Set the fetched users
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  };

  const handleAssignRoleToUser = async (roleId: string) => {
    setOpenUserModal(true); // Open the modal for assigning the role
    setSelectedRoleId(roleId); // Set the selected role ID to be assigned
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const filteredUsers = users.filter(user => 
    user.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleUserAssign = async (userId: string) => {
    try {
      await axiosInstance.current?.post(`/role-bindings`, { role_id: selectedRoleId, user_id: userId });
      handleCloseUserModal(); // Close the user assignment modal
      // Optionally refresh roles or users here
    } catch (error) {
      console.error('Failed to assign role to user:', error);
    }
  };

  const handleUserRemove = async (roleBindingId: string) => {
    try {
      await axiosInstance.current?.delete(`/role-bindings/${roleBindingId}`);
      // Refresh the role users after removal
      fetchUsersByRole(selectedRoleId!);
    } catch (error) {
      console.error('Failed to remove user from role:', error);
    }
  };

  useEffect(() => {
    fetchRoles(); // Fetch roles when the component mounts
    fetchUsers();
  }, [workspaceId]); // Re-fetch if workspaceId changes

  return (
    <div>
      <h2>Роли пространства</h2>
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
      {/* Button to open the modal for creating a role */}
      <Button variant="contained" onClick={handleOpenModal}>
        Создать роль
      </Button>

      {/* Create Role Modal */}
      <Dialog open={openModal} onClose={handleCloseModal}>
        <DialogTitle>{editingRoleId ? 'Редактировать роль' : 'Создать роль'}</DialogTitle>
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
            {/* Permissions Checkboxes */}
            <div className="permissions">
              {Object.keys(permissions).map((key) => (
                <label key={key}>
                  <input
                    type="checkbox"
                    checked={permissions[key as keyof typeof permissions]}
                    onChange={() => setPermissions((prev) => ({ ...prev, [key]: !prev[key as keyof typeof permissions] }))}
                  />
                  {key.charAt(0).toUpperCase() + key.slice(1)}
                </label>
              ))}
            </div>
          </form>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseModal}>Отмена</Button>
          <Button onClick={editingRoleId ? () => handleUpdateRole(editingRoleId) : handleCreateRole} variant="contained" type="submit">
            {editingRoleId ? 'Сохранить' : 'Создать роль'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* User Assignment Modal */}
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
            {filteredUsers.map(user => (
              <ListItem key={user.id}>
                <ListItemText primary={user.username} />
                <Button variant="outlined" onClick={() => handleUserAssign(user.id)}>Назначить</Button>
              </ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseUserModal}>Закрыть</Button>
        </DialogActions>
      </Dialog>

      <div className="roles-list">
        {roles.map((role) => (
          <div key={role.id} className="role-item">
            <h4>{role.name}</h4>
            <div className="permissions">
              <h5>Права:</h5>
              <ul>
                {role && [["Создавать секреты", role.create],
                 ["Читать секреты", role.read],
                 ["Обновлять секреты", role.update],
                 ["Удалять секреты", role.deletable],
                 ["Смотреть логи", role.see_logs],
                 ["Назначать роли", role.give_roles],
                 ["Управлять пользователями", role.add_users],
                 ["Управление пространством", role.admin_rights]].map(([permission, value]) => (
                  <li key={permission as string}>{permission}: {value ? 'Да' : 'Нет'}</li>
                ))}
              </ul>
            </div>
            <Button variant="outlined" onClick={() => handleEditRole(role.id)}>Редактировать</Button>
            <Button variant="outlined" onClick={() => handleDeleteRole(role.id)}>Удалить</Button>
            <Button variant="outlined" onClick={() => handleAssignRoleToUser(role.id)}>Назначить</Button>
            <Button variant="outlined" onClick={() => handleOpenRoleUsersModal(role.id)}>Пользователи</Button>
          </div>
        ))}
      </div>

      <Dialog open={openRoleUsersModal} onClose={handleCloseRoleUsersModal}>
        <DialogTitle>Пользователи роли</DialogTitle>
        <DialogContent>
          <List>
            {roleUsers.map(roleBinding => (
              <ListItem key={roleBinding.user_id}>
                <ListItemText primary={roleBinding.username} />
                <Button variant="outlined" onClick={() => handleUserRemove(roleBinding.id)}>Удалить</Button>
              </ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseRoleUsersModal}>Закрыть</Button>
        </DialogActions>
      </Dialog>
    </div>
  )
}

export default RolesPage 