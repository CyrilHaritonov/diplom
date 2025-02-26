import { Request, Response } from 'express';
import { getKeycloak } from './keycloak.middleware';
import axios from 'axios';

interface User {
    id: string,
    username: string
}

export class AuthController {
    static login(req: Request, res: Response) {
        return getKeycloak().protect()(req, res, () => {
            res.json({ message: 'Login successful' });
        });
    }

    static logout(req: Request, res: Response) {
        const baseUrl = `${req.protocol}://${req.get('host')}`;
        return res.redirect(getKeycloak().logoutUrl(baseUrl));
    }

    static getUserInfo(req: Request, res: Response) {
        return getKeycloak().protect()(req, res, () => {
            // @ts-ignore - Keycloak adds the user property to the request
            const userInfo = req.kauth?.grant?.access_token?.content || {};
            res.json(userInfo);
        });
    }

    static async getUserIdByUsername(req: Request, res: Response): Promise<void> {
        const { username } = req.params; // Assuming username is passed as a URL parameter
        const keycloakTokenUrl = `${process.env.KEYCLOAK_AUTH_SERVER_URL}/realms/${process.env.KEYCLOAK_REALM}/protocol/openid-connect/token`;
        
        // Get Keycloak admin credentials from environment variables
        const adminUsername = process.env.KEYCLOAK_ADMIN_USERNAME;
        const adminPassword = process.env.KEYCLOAK_ADMIN_PASSWORD;
        const adminClientId = process.env.KEYCLOAK_CLIENT_ID;
        if (!adminUsername || !adminPassword || !adminClientId) {
            res.status(400).json({ error: 'Admin username, password and client id env variables are not set' });
            return; // Ensure to return after sending a response
        }

        try {
            // Step 1: Obtain access token
            const tokenResponse = await axios.post(keycloakTokenUrl, new URLSearchParams({
                username: adminUsername as string,
                password: adminPassword as string,
                client_id: adminClientId as string,
                grant_type: 'password',
            }), {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
            });

            const accessToken = tokenResponse.data.access_token;

            // Step 2: Fetch user ID based on the username
            const keycloakAdminUrl = `${process.env.KEYCLOAK_AUTH_SERVER_URL}/admin/realms/${process.env.KEYCLOAK_REALM}/users`;
            const response = await axios.get(keycloakAdminUrl, {
                params: {
                    username: username,
                },
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });

            const users = response.data;
            if (users.length > 0) {
                res.json({ userId: users[0].id }); // Return the first user's ID
            } else {
                res.status(404).json({ error: 'User not found' });
            }
        } catch (error) {
            console.error('Failed to retrieve user ID:', error);
            res.status(500).json({ error: 'Failed to retrieve user ID' });
        }
    }

    // Method to get username by user ID
    static async getUsernameByUserId(req: Request, res: Response): Promise<void> {
            const { userId } = req.params; // Assuming username is passed as a URL parameter
            const keycloakTokenUrl = `${process.env.KEYCLOAK_AUTH_SERVER_URL}/realms/${process.env.KEYCLOAK_REALM}/protocol/openid-connect/token`;
            
            // Get Keycloak admin credentials from environment variables
            const adminUsername = process.env.KEYCLOAK_ADMIN_USERNAME;
            const adminPassword = process.env.KEYCLOAK_ADMIN_PASSWORD;
            const adminClientId = process.env.KEYCLOAK_CLIENT_ID;
            if (!adminUsername || !adminPassword || !adminClientId) {
                res.status(400).json({ error: 'Admin username, password and client id env variables are not set' });
                return; // Ensure to return after sending a response
            }

            try {
            // Step 1: Obtain access token
            const tokenResponse = await axios.post(keycloakTokenUrl, new URLSearchParams({
                username: adminUsername as string,
                password: adminPassword as string,
                client_id: adminClientId as string,
                grant_type: 'password',
            }), {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
            });

            const accessToken = tokenResponse.data.access_token;

            // Step 2: Fetch user details based on the user ID
            const response = await axios.get(`${process.env.KEYCLOAK_AUTH_SERVER_URL}/admin/realms/${process.env.KEYCLOAK_REALM}/users/${userId}`, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });

            const user = response.data;
            if (user) {
                res.json({ username: user.username }); // Return the username
            } else {
                res.status(404).json({ error: 'User not found' });
            }
        } catch (error) {
            console.error('Failed to retrieve username:', error);
            res.status(500).json({ error: 'Failed to retrieve username' });
        }
    }

    static async getUsers(req: Request, res: Response): Promise<void> {
        const keycloakTokenUrl = `${process.env.KEYCLOAK_AUTH_SERVER_URL}/realms/${process.env.KEYCLOAK_REALM}/protocol/openid-connect/token`;
        const adminUsername = process.env.KEYCLOAK_ADMIN_USERNAME;
        const adminPassword = process.env.KEYCLOAK_ADMIN_PASSWORD;
        const adminClientId = process.env.KEYCLOAK_CLIENT_ID;
        if (!adminUsername || !adminPassword || !adminClientId) {
            res.status(400).json({ error: 'Admin username, password and client id env variables are not set' });
            return; // Ensure to return after sending a response
        }

        try {
            // Step 1: Obtain access token
            const tokenResponse = await axios.post(keycloakTokenUrl, new URLSearchParams({
                username: adminUsername as string,
                password: adminPassword as string,
                client_id: adminClientId as string,
                grant_type: 'password',
            }), {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
            });

            const accessToken = tokenResponse.data.access_token;

            // Step 2: Fetch all users
            const keycloakAdminUrl = `${process.env.KEYCLOAK_AUTH_SERVER_URL}/admin/realms/${process.env.KEYCLOAK_REALM}/users`;
            const response = await axios.get(keycloakAdminUrl, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });

            const users: User[] = response.data;
            const filteredUsers = users.map(user => ({
                id: user.id,
                username: user.username
            }));
            res.json(filteredUsers);
        } catch (error) {
            console.error('Failed to retrieve users:', error);
            res.status(500).json({ error: 'Failed to retrieve users' });
        }
    }
} 