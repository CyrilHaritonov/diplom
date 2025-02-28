import express from 'express';
import { AuthController } from './auth.controller';
import { logAction } from '../logging/logging.middleware';
import { LogAction, LogSubject } from '../logging/types';

export function createAuthRouter(keycloak: any, botUrl: string) {
    const router = express.Router();

    // Protected routes
    router.get('/userinfo', 
        keycloak.protect(),
        logAction(LogAction.ACCESS, LogSubject.USER_INFO, botUrl),
        AuthController.getUserInfo
    );

    // Route for getting id by username
    router.get('/user/:username',
        keycloak.protect(),
        logAction(LogAction.ACCESS, LogSubject.USER_INFO, botUrl),
        AuthController.getUserIdByUsername);

    // Route for getting username by user ID
    router.get('/user-id/:userId',
        keycloak.protect(),
        logAction(LogAction.ACCESS, LogSubject.USER_INFO, botUrl),
        AuthController.getUsernameByUserId);

    // Get all users
    router.get('/users',
        keycloak.protect(),
        logAction(LogAction.ACCESS, LogSubject.USER_INFO, botUrl),
        AuthController.getUsers);

    return router;
} 