export enum LogAction {
    CREATE = 'create',
    READ = 'read',
    UPDATE = 'update',
    DELETE = 'delete',
    ACCESS = 'access',
    EXPORT = 'export'
}

export enum LogSubject {
    WORKSPACE = 'workspace',
    ROLE = 'role',
    ROLE_BINDING = 'role_binding',
    WORKSPACE_USER = 'workspace_user',
    LOGIN = 'login',
    LOGOUT = 'logout',
    USER_INFO = 'user_info',
    LOG = 'log',
    USER_WORKSPACE_ROLES = 'user_workspace_roles',
    EVENT_BINDING = 'event_binding',
    SECRET = 'secret',
    CHAT_BINDING= 'chat_binding'
}

export interface ActionLog {
    user_id: string;
    action: LogAction;
    subject: LogSubject;
    timestamp: Date;
    workspace_id?: string;
    subject_name?: string;
} 