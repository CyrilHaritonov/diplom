import 'reflect-metadata';
import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import { keycloakMiddleware, getKeycloak } from './modules/auth/keycloak.middleware';
import { createAuthRouter } from './modules/auth/auth.routes';
import { AppDataSource } from './config/database';
import { createLoggingRouter } from './modules/logging/logging.routes';
import { createWorkspaceRouter } from './modules/workspaces/workspace.routes';
import { createRoleRouter } from './modules/roles/role.routes';
import { createRoleBindingRouter } from './modules/role-bindings/role-binding.routes';
import { createWorkspaceUserRouter } from './modules/workspace-users/workspace-user.routes';
import { createEventBindingRouter } from './modules/event-bindings/event-binding.routes';
import { createSecretRouter } from './modules/secrets/secret.routes';
import dotenv from 'dotenv';

const app: Express = express();
const port = process.env.PORT || 3000;

// Initialize the application
async function initializeApp() {
    dotenv.config();
    // Initialize database connection
    await AppDataSource.initialize();
    console.log('Database connection initialized');

    // CORS setup
    const corsOptions = {
        origin: process.env.CORS_ORIGIN || '*',
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        credentials: true
    };
    app.use(cors(corsOptions));
    app.options('*', cors(corsOptions));
    // Session and Keycloak setup
    await keycloakMiddleware(app);

    app.use(express.json());

    // Auth routes - initialize after Keycloak is ready
    const keycloak = getKeycloak();
    app.use('/auth', createAuthRouter(keycloak));
    app.use('/logs', createLoggingRouter(keycloak));
    app.use('/workspaces', createWorkspaceRouter(keycloak));
    app.use('/roles', createRoleRouter(keycloak));
    app.use('/role-bindings', createRoleBindingRouter(keycloak));
    app.use('/workspace-users', createWorkspaceUserRouter(keycloak));
    app.use('/event-bindings', createEventBindingRouter(keycloak));
    app.use('/secrets', createSecretRouter(keycloak));

    app.get('/', (req: Request, res: Response) => {
        res.send('Express + TypeScript Server');
    });

    app.listen(port, () => {
        console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
    });
}

// Start the application
initializeApp().catch(error => {
    console.error('Failed to initialize app:', error);
    process.exit(1);
});

