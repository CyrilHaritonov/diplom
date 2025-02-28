import React, { useState, useEffect, useCallback } from 'react';
import { Box, Button, Container, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, Typography, List, ListItem, ListItemText, Snackbar } from '@mui/material';
import { useAxios } from '../utils/hooks';
import { Link, useParams } from 'react-router-dom';
import { ArrowBack } from "@mui/icons-material";
import { useNavigate } from 'react-router-dom';

enum EventType {
    CREATE = 'create',
    READ = 'read',
    UPDATE = 'update',
    DELETE = 'delete',
    ACCESS = 'access',
    EXPORT = 'export'
}

const EventTypeLabels: Record<EventType, string> = {
    [EventType.CREATE]: 'Создание',
    [EventType.READ]: 'Чтение',
    [EventType.UPDATE]: 'Редактирование',
    [EventType.DELETE]: 'Удаление',
    [EventType.ACCESS]: 'Чтение логов',
    [EventType.EXPORT]: 'Экспорт логов'
};

interface EventBinding {
    id: string;
    user_id: string;
    type: EventType;
    workspace_id: string;
}

const NotificationsPage: React.FC = () => {
    const axiosInstance = useAxios(import.meta.env.VITE_API_URL);
    const { workspaceId } = useParams<{ workspaceId: string }>();
    const [activeBindings, setActiveBindings] = useState<EventBinding[]>([]);
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedType, setSelectedType] = useState<EventType | null>(null);
    const [confirmDelete, setConfirmDelete] = useState<{ open: boolean; id: string | null }>({ open: false, id: null });
    const [workspaceName, setWorkspaceName] = useState<string | null>("");
    const [errorMessage, setErrorMessage] = useState<string | null>(null)
    const navigate = useNavigate();

    const handleCloseSnackbar = () => {
        setErrorMessage(null)
    }

    const fetchWorkspace = useCallback(async () => {
        try {
            const response = await axiosInstance.current?.get(`/workspaces/${workspaceId}`);
            setWorkspaceName(response?.data.name);
        } catch (error) {
            console.error("Failed to fetch workspace:", error);
        }
    }, [axiosInstance, workspaceId]);

    const fetchEventBindings = () => {
        axiosInstance.current?.get(`/event-bindings/bindings?workspace_id=${workspaceId}`)
            .then((res: any) => setActiveBindings(res?.data))
            .catch((error: any) => console.error('Failed to fetch event bindings', error));
    }
    useEffect(() => {
        fetchEventBindings()
        fetchWorkspace()
    }, [workspaceId]);

    const handleSubscribe = (type: EventType) => {
        axiosInstance.current?.post('/event-bindings', { type, workspace_id: workspaceId })
            .then(() => fetchEventBindings())
            .catch((error: any) => {
                if (error?.response.status === 403) {
                    setErrorMessage("У вас нет прав на просмотр событий в этом пространстве.")
                }
                console.error('Failed to subscribe', error)});
    };

    const handleDelete = (id: string) => {
        axiosInstance.current?.delete(`/event-bindings/${id}`)
            .then(() => fetchEventBindings())
            .catch(error => console.error('Failed to delete binding', error));
    };

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
                </Box>
                <Box sx={{ mb: 4, display: "flex", gap: 2 }}>
                    <Button variant="outlined" component={Link} to={`/workspaces/${workspaceId}/secrets`}>
                        Секреты
                    </Button>
                    <Button variant="outlined" component={Link} to={`/workspaces/${workspaceId}/users`}>
                        Пользователи
                    </Button>
                    <Button variant="outlined" component={Link} to={`/workspaces/${workspaceId}/roles`}>
                        Роли
                    </Button>
                    <Button
                        variant="contained"
                        component={Link}
                        to={`/workspaces/${workspaceId}/notifications`}
                        sx={{
                        backgroundColor: "#0369a1",
                        "&:hover": {
                            backgroundColor: "#0284c7",
                        },
                        }}
                    >
                        Уведомления
                    </Button>
                </Box>
                <Typography variant="h4" sx={{ color: "text.primary" }} gutterBottom>Настройки уведомлений</Typography>
                <List>
                    {Object.values(EventType).map(type => {
                        const isActive = activeBindings.some(binding => binding.type === type);
                        const binding = activeBindings.find(binding => binding.type === type);
                        return (
                            <ListItem key={type} sx={{
                                backgroundColor: "white",
                                mb: 1,
                                borderRadius: "4px",
                                "&:hover": {
                                  backgroundColor: "#f0f9ff",
                                },
                              }}>
                                <ListItemText
                                    primary={
                                    <Typography color="text.primary" sx={{ fontWeight: "bold" }}>
                                        {EventTypeLabels[type]}
                                    </Typography>
                                    }
                                />
                                {isActive ? (
                                    <Button color="error" onClick={() => setConfirmDelete({ open: true, id: binding?.id || null })}>
                                        Удалить
                                    </Button>
                                ) : (
                                    <Button color="primary" onClick={() => { setSelectedType(type); setModalOpen(true); }}>
                                        Подписаться
                                    </Button>
                                )}
                            </ListItem>
                        );
                    })}
                </List>
                <Dialog open={modalOpen} onClose={() => setModalOpen(false)}>
                    <DialogTitle>Подтвердите подписку</DialogTitle>
                    <DialogContent>
                        <Typography>Вы уверены, что хотите подписаться на уведомления типа "{selectedType && EventTypeLabels[selectedType]}"?</Typography>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setModalOpen(false)}>Отмена</Button>
                        <Button onClick={() => { if (selectedType) handleSubscribe(selectedType); setModalOpen(false); }} color="primary">Подписаться</Button>
                    </DialogActions>
                </Dialog>
                <Dialog open={confirmDelete.open} onClose={() => setConfirmDelete({ open: false, id: null })}>
                    <DialogTitle>Подтвердите удаление</DialogTitle>
                    <DialogContent>
                        <Typography>Вы уверены, что хотите удалить подписку?</Typography>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setConfirmDelete({ open: false, id: null })}>Отмена</Button>
                        <Button onClick={() => { if (confirmDelete.id) handleDelete(confirmDelete.id); setConfirmDelete({ open: false, id: null }); }} color="error">Удалить</Button>
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
    );
};

export default NotificationsPage;
