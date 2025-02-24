import { FC, useEffect, useState } from 'react';
import { Button, List, ListItem, ListItemText, Pagination, Checkbox, FormControlLabel } from '@mui/material';
import { Link } from 'react-router-dom';
import { useAxios } from '../utils/hooks';

interface Log {
  id: string;
  user_id: string;
  action: string;
  subject: string;
  timestamp: Date;
  workspace_id?: string;
  subject_name?: string;
}

interface Workspace {
  id: string;
  name: string;
}

interface User {
  id: string;
  username: string;
}

// Updated permissions list to match the backend types
const permissionsList = [
  { label: 'Создание', value: 'create' },
  { label: 'Чтение', value: 'read' },
  { label: 'Обновление', value: 'update' },
  { label: 'Удаление', value: 'delete' },
  { label: 'Доступ', value: 'access' },
  { label: 'Экспорт', value: 'export' },
];

const EventsPage: FC = () => {
  const [logs, setLogs] = useState<Log[]>([]);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const logsPerPage = 25; // Number of logs to display per page
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const axiosInstance = useAxios(import.meta.env.VITE_API_URL);

  const fetchLogs = async () => {
    try {
      const response = await axiosInstance.current?.get('/logs/');
      const data = response?.data;
      setLogs(data); // Set the fetched logs
    } catch (error) {
      console.error('Failed to fetch logs:', error);
    }
  };

  const fetchWorkspaces = async () => {
    try {
      const response = await axiosInstance.current?.get('/workspaces');
      const data = response?.data;
      setWorkspaces(data); // Set the fetched workspaces
    } catch (error) {
      console.error('Failed to fetch workspaces:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await axiosInstance.current?.get('/auth/users');
      const data = response?.data;
      setUsers(data); // Set the fetched users
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  };

  useEffect(() => {
    fetchLogs(); // Fetch logs when the component mounts
    fetchWorkspaces(); // Fetch workspaces when the component mounts
    fetchUsers(); // Fetch users when the component mounts
  }, []);

  // Handle page change
  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setCurrentPage(value);
  };

  // Handle permission checkbox change
  const handlePermissionChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = event.target;
    setSelectedPermissions(prev =>
      prev.includes(value) ? prev.filter(permission => permission !== value) : [...prev, value]
    );
  };

  // Filter logs based on selected permissions
  const filteredLogs = logs.filter(log => {
    return selectedPermissions.length === 0 || selectedPermissions.includes(log.action);
  });

  // Calculate the logs to display for the current page
  const indexOfLastLog = currentPage * logsPerPage;
  const indexOfFirstLog = indexOfLastLog - logsPerPage;
  const currentLogs = filteredLogs.slice(indexOfFirstLog, indexOfLastLog);

  // Function to handle log export
  const handleExportLogs = async () => {
    try {
      const response = await axiosInstance.current?.get('/logs/export', {
        responseType: 'blob', // Important for file download
      });
      if (!response) {
        throw new Error("No response");
      }
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'logs_export.csv'); // Set the file name
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Failed to export logs:', error);
    }
  };
  
  return (
    <div>
      <h2>Журнал событий</h2>

      {/* Event Bindings Configuration */}
      <div className="event-bindings">
        <h3>Настройка уведомлений</h3>
        <form>
          {/* Checkboxes for different event types */}
          <div className="event-types">
            {permissionsList.map(permission => (
              <FormControlLabel
                key={permission.value}
                control={
                  <Checkbox
                  checked={selectedPermissions.includes(permission.value)}
                  onChange={handlePermissionChange}
                  value={permission.value}
                  />
                }
                label={permission.label}
                />
              ))}
          </div>
        </form>
      </div>
      {/* Export button */}
      <Button variant="contained" onClick={handleExportLogs}>Экспорт логов</Button>

      {/* Events Log */}
      <div className="events-log">
        <h3>Журнал событий</h3>

        {/* Log entries list */}
        <div className="log-entries">
          {currentLogs.map(log => {
            const workspace = workspaces.find(ws => ws.id === log.workspace_id);
            const user = users.find(u => u.id === log.user_id);
            return (
              <ListItem key={log.id}>
                <ListItemText
                  primary={`${new Date(log.timestamp).toLocaleString()} - ${log.action} - ${log.subject} - ${user ? user.username : 'Неизвестный пользователь'} - `}
                  secondary={
                    workspace ? (
                      <Link to={`/workspaces/${workspace.id}`} style={{ textDecoration: 'underline', color: 'blue' }}>
                        {workspace.name}
                      </Link>
                    ) : (
                      'Неизвестное пространство'
                    )
                  }
                />
              </ListItem>
            );
          })}
        </div>


        {/* Pagination */}
        <Pagination
          count={Math.ceil(filteredLogs.length / logsPerPage)}
          page={currentPage}
          onChange={handlePageChange}
          variant="outlined"
          shape="rounded"
        />
      </div>
    </div>
  );
};

export default EventsPage; 