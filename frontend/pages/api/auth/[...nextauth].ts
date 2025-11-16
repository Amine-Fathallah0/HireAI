import NextAuth, { NextAuthOptions } from "next-auth";
import KeycloakProvider from "next-auth/providers/keycloak";
import CredentialsProvider from "next-auth/providers/credentials";

/**
 * Refreshes the access token using the refresh token
 */
async function refreshAccessToken(token: any) {
  try {
    console.log('[NextAuth] Refreshing access token...');
    
    const response = await fetch(
      `${process.env.KEYCLOAK_ISSUER}/protocol/openid-connect/token`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: process.env.KEYCLOAK_CLIENT_ID!,
          client_secret: process.env.KEYCLOAK_CLIENT_SECRET!,
          grant_type: 'refresh_token',
          refresh_token: token.refreshToken,
        }),
      }
    );

    const refreshedTokens = await response.json();

    if (!response.ok) {
      console.error('[NextAuth] Token refresh failed:', refreshedTokens);
      throw refreshedTokens;
    }

    console.log('[NextAuth] ✅ Token refreshed successfully');

    return {
      ...token,
      accessToken: refreshedTokens.access_token,
      idToken: refreshedTokens.id_token,
      expiresAt: Math.floor(Date.now() / 1000) + refreshedTokens.expires_in,
      refreshToken: refreshedTokens.refresh_token ?? token.refreshToken, // Use new refresh token or keep old one
    };
  } catch (error) {
    console.error('[NextAuth] ❌ Error refreshing access token:', error);

    return {
      ...token,
      error: 'RefreshAccessTokenError',
    };
  }
}

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
      // Initial sign in - store tokens
      if (account && user) {
        console.log('[NextAuth] Initial sign in, storing tokens');
        return {
          ...token,
          accessToken: account.access_token,
          refreshToken: account.refresh_token,
          idToken: account.id_token,
          expiresAt: account.expires_at,
          id: user.id,
          provider: account.provider, // Store provider for logout
        };
      }
      
      // Handle credentials provider tokens
      if (user && account?.provider === 'credentials') {
        console.log('[NextAuth] Credentials login, storing tokens');
        return {
          ...token,
          accessToken: (user as any).accessToken,
          refreshToken: (user as any).refreshToken,
          idToken: (user as any).idToken,
          expiresAt: Math.floor(Date.now() / 1000) + 1800, // Default 30 minutes
          id: user.id,
          provider: 'credentials',
        };
      }

      // Return previous token if the access token has not expired yet
      const now = Math.floor(Date.now() / 1000);
      const expiresAt = token.expiresAt as number;
      
      // Check if token is still valid (with 2 minute buffer before expiry)
      if (expiresAt && now < expiresAt - 120) {
        console.log('[NextAuth] Token still valid, expires in', Math.floor((expiresAt - now) / 60), 'minutes');
        return token;
      }

      // Token has expired or is about to expire, try to refresh it
      console.log('[NextAuth] Token expired or expiring soon, refreshing...');
      return refreshAccessToken(token);
    },
    async session({ session, token }) {
      // Pass all necessary tokens to the client session
      (session as any).accessToken = token.accessToken;
      (session as any).idToken = token.idToken;
      (session as any).refreshToken = token.refreshToken;
      (session as any).error = token.error;
      (session as any).expiresAt = token.expiresAt;
      (session as any).provider = token.provider;
      
      if (session.user) {
        session.user = {
          ...session.user,
          id: token.id as string || token.sub,
        };
      }
      return session;
    },
  },
  events: {
    async signOut({ token }: { token: any }) {
      // Revoke the token with Keycloak when signing out
      if (token?.provider === 'keycloak' && token?.refreshToken) {
        try {
          console.log('[NextAuth] Revoking Keycloak tokens on signout');
          await fetch(
            `${process.env.KEYCLOAK_ISSUER}/protocol/openid-connect/logout`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
              body: new URLSearchParams({
                client_id: process.env.KEYCLOAK_CLIENT_ID!,
                client_secret: process.env.KEYCLOAK_CLIENT_SECRET!,
                refresh_token: token.refreshToken,
              }),
            }
          );
          console.log('[NextAuth] ✅ Keycloak tokens revoked');
        } catch (error) {
          console.error('[NextAuth] ❌ Failed to revoke Keycloak tokens:', error);
        }
      }
    },
  },
  pages: {
    signIn: '/auth/signin',
  },
  session: {
    strategy: 'jwt',
    maxAge: 8 * 60 * 60, // 8 hours (should match or exceed Keycloak's SSO Session Max)
  },
  debug: true, // Enable debug mode to see detailed logs
};

export default NextAuth(authOptions);



