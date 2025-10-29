import NextAuth, { NextAuthOptions } from "next-auth";
import KeycloakProvider from "next-auth/providers/keycloak";
import CredentialsProvider from "next-auth/providers/credentials";

export const authOptions: NextAuthOptions = {
  providers: [
    KeycloakProvider({
      clientId: process.env.KEYCLOAK_CLIENT_ID!,
      clientSecret: process.env.KEYCLOAK_CLIENT_SECRET!,
      issuer: process.env.KEYCLOAK_ISSUER,
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          // Authenticate with Keycloak directly using Resource Owner Password Credentials Grant
          const keycloakTokenUrl = `${process.env.KEYCLOAK_ISSUER}/protocol/openid-connect/token`;
          
          const tokenResponse = await fetch(keycloakTokenUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
              grant_type: 'password',
              client_id: process.env.KEYCLOAK_CLIENT_ID!,
              client_secret: process.env.KEYCLOAK_CLIENT_SECRET!,
              username: credentials.email,
              password: credentials.password,
              scope: 'openid email profile'
            }),
          });

          if (!tokenResponse.ok) {
            console.error('Keycloak authentication failed:', await tokenResponse.text());
            return null;
          }

          const tokens = await tokenResponse.json();
          
          // Get user info from Keycloak
          const userInfoResponse = await fetch(`${process.env.KEYCLOAK_ISSUER}/protocol/openid-connect/userinfo`, {
            headers: {
              'Authorization': `Bearer ${tokens.access_token}`,
            },
          });

          if (!userInfoResponse.ok) {
            return null;
          }

          const userInfo = await userInfoResponse.json();

          return {
            id: userInfo.sub,
            email: userInfo.email,
            name: userInfo.name,
            accessToken: tokens.access_token,
            refreshToken: tokens.refresh_token,
            idToken: tokens.id_token,
          };
        } catch (error) {
          console.error('Authentication error:', error);
          return null;
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, account, user }) {
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.idToken = account.id_token;
        token.expiresAt = account.expires_at;
      }
      
      // Handle credentials provider tokens
      if (user && account?.provider === 'credentials') {
        token.accessToken = (user as any).accessToken;
        token.refreshToken = (user as any).refreshToken;
        token.idToken = (user as any).idToken;
      }
      
      return token;
    },
    async session({ session, token }) {
      // Pass all necessary tokens to the client session
      (session as any).accessToken = token.accessToken;
      (session as any).idToken = token.idToken;
      (session as any).refreshToken = token.refreshToken;
      (session as any).error = token.error;
      
      session.user = {
        ...session.user,
        id: token.sub,
      };
      return session;
    },
  },
  pages: {
    signIn: '/auth/signin',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  debug: true, // Enable debug mode to see detailed logs
};

export default NextAuth(authOptions);



