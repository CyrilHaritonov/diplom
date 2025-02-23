import { Express } from 'express';
import session from 'express-session';
import Keycloak from 'keycloak-connect';
import { createClient } from 'redis';
import RedisStore from 'connect-redis';

let keycloak: Keycloak.Keycloak;

const getKeycloakConfig = () => {
    const requiredVars = [
        'KEYCLOAK_REALM',
        'KEYCLOAK_AUTH_SERVER_URL',
        'KEYCLOAK_SSL_REQUIRED',
        'KEYCLOAK_CLIENT_ID',
        'KEYCLOAK_PUBLIC_CLIENT',
        'KEYCLOAK_CONFIDENTIAL_PORT',
        'SESSION_SECRET'
    ];

    const missingVars = requiredVars.filter(varName => !process.env[varName]);
    if (missingVars.length > 0) {
        throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
    }
    if (isNaN(Number(process.env.KEYCLOAK_CONFIDENTIAL_PORT))) {
        throw new Error('KEYCLOAK_CONFIDENTIAL_PORT must be a valid number');
    }

    return {
        realm: process.env.KEYCLOAK_REALM as string,
        'auth-server-url': process.env.KEYCLOAK_AUTH_SERVER_URL as string,
        'ssl-required': process.env.KEYCLOAK_SSL_REQUIRED as string,
        resource: process.env.KEYCLOAK_CLIENT_ID as string,
        'public-client': process.env.KEYCLOAK_PUBLIC_CLIENT as string,
        'confidential-port': Number(process.env.KEYCLOAK_CONFIDENTIAL_PORT)
    };
};

const initSessionStore = async () => {
    if (process.env.NODE_ENV === 'production') {
        const redisClient = createClient({
            url: process.env.REDIS_URL
        });
        await redisClient.connect();
        return new RedisStore({ client: redisClient });
    }
    return new session.MemoryStore();
};

export const initKeycloak = async (): Promise<Keycloak.Keycloak> => {
    if (keycloak) {
        return keycloak;
    }

    const store = await initSessionStore();
    keycloak = new Keycloak({ store }, getKeycloakConfig());

    return keycloak;
};

export const getKeycloak = (): Keycloak.Keycloak => {
    if (!keycloak) {
        throw new Error('Keycloak has not been initialized. Please ensure it is initialized before using it.');
    }
    return keycloak;
};

export const keycloakMiddleware = async (app: Express): Promise<void> => {
    const store = await initSessionStore();
    
    app.use(session({
        store,
        secret: process.env.SESSION_SECRET as string,
        resave: false,
        saveUninitialized: true,
        cookie: {
            secure: process.env.NODE_ENV === 'production',
            maxAge: 1000 * 60 * 60 * 24 // 24 hours
        }
    }));

    keycloak = await initKeycloak();
    app.use(keycloak.middleware());
}; 