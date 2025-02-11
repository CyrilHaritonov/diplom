import express from 'express';
import { AuthController } from './auth.controller';
import { logAction } from '../logging/logging.middleware';
import { LogAction, LogSubject } from '../logging/types';

export function createAuthRouter(keycloak: any) {
    const router = express.Router();

    // Public routes
    router.get('/login', 
        logAction(LogAction.ATTEMPT, LogSubject.LOGIN),
        AuthController.login
    );
    
    router.get('/logout',
        logAction(LogAction.ATTEMPT, LogSubject.LOGOUT), 
        AuthController.logout
    );

    // Protected routes
    router.get('/userinfo', 
        keycloak.protect(),
        logAction(LogAction.ACCESS, LogSubject.USER_INFO),
        AuthController.getUserInfo
    );

    return router;
} 