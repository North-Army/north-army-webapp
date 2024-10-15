import {fetchAuthSession, signIn, signOut} from '@aws-amplify/auth';
import { Amplify } from 'aws-amplify';
import { CognitoIdentityClient } from '@aws-sdk/client-cognito-identity';
import { fromCognitoIdentityPool } from '@aws-sdk/credential-providers';

Amplify.configure({
    Auth: {
        Cognito: {
            userPoolClientId: import.meta.env.VITE_USER_POOL_CLIENT_ID!,
            userPoolId: import.meta.env.VITE_USER_POOL_ID!,
        },
    },
});

export class AuthService {
    public async login(username: string, password: string) {
        
        const { isSignedIn } = await signIn({
            username,
            password,
        });

        if (isSignedIn) {
            const { accessToken, idToken } =
            (await fetchAuthSession()).tokens ?? {};
            return { accessToken, idToken };
        }
        return;
    }

    public async logout() {
        try {
            await signOut();
            console.log("Sesión cerrada correctamente");
        } catch (error) {
            console.error("Error al cerrar sesión:", error);
        }
    }

    public async refreshSession() {

        try {
            const { accessToken, idToken } = (await fetchAuthSession({
                forceRefresh: true ,
            })).tokens ?? {};
            return { accessToken, idToken };
        } catch (error) {
            console.error("Error al renovar sesión:", error);
            return null;
        }
    }

    public async generateTemporaryCredentials(idToken: string) {

        const client = new CognitoIdentityClient({
            region: import.meta.env.VITE_AWS_REGION!,
            credentials: fromCognitoIdentityPool({
                identityPoolId: import.meta.env.VITE_IDENTITY_POOL_ID!,
                logins: {
                    [`cognito-idp.${import.meta.env.VITE_AWS_REGION!}.amazonaws.com/${import.meta.env.VITE_USER_POOL_ID!}`]: idToken,
                },
                clientConfig: {
                    region: import.meta.env.VITE_AWS_REGION!,
                },
            }),
        })

        return await client.config.credentials();
    }
}