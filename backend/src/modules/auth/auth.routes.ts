import express from 'express';
import { AuthController } from './auth.controller';
import { logAction } from '../logging/logging.middleware';
import { LogAction, LogSubject } from '../logging/types';

export function createAuthRouter(keycloak: any) {
    const router = express.Router();

    // Protected routes
    router.get('/userinfo', 
        keycloak.protect(),
        logAction(LogAction.ACCESS, LogSubject.USER_INFO),
        AuthController.getUserInfo
    );

    router.get('/user/:username',
        keycloak.protect(),
        logAction(LogAction.ACCESS, LogSubject.USER_INFO),
        AuthController.getUserIdByUsername);

    // Route for getting username by user ID
    router.get('/user-id/:userId',
        keycloak.protect(),
        logAction(LogAction.ACCESS, LogSubject.USER_INFO),
        AuthController.getUsernameByUserId);

    // Get all users
    router.get('/users',
        keycloak.protect(),
        logAction(LogAction.ACCESS, LogSubject.USER_INFO),
        AuthController.getUsers);

    return router;
} 