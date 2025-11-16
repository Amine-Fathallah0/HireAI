import NextAuth, { NextAuthOptions } from "next-auth";
import KeycloakProvider from "next-auth/providers/keycloak";
import CredentialsProvider from "next-auth/providers/credentials";

/**
 * Refreshes the access token using the refresh token
 */
async function refreshAccessToken(token: any) {
  try {
    console.log('[NextAuth] Refreshing access token...');
    console.log('[NextAuth] Refresh token present:', !!token.refreshToken);
    console.log('[NextAuth] Token expiresAt:', token.expiresAt, 'Current time:', Math.floor(Date.now() / 1000));
    
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
            expiresIn: tokens.expires_in, // Include expires_in from Keycloak
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
      // Handle credentials provider tokens (must come first!)
      if (user && account?.provider === 'credentials') {
        const expiresIn = (user as any).expiresIn || 300; // Use actual expires_in or default to 5 minutes
        const newExpiresAt = Math.floor(Date.now() / 1000) + expiresIn;
        console.log('[NextAuth] Credentials login, storing tokens');
        console.log('[NextAuth] ExpiresIn:', expiresIn, 'New ExpiresAt:', newExpiresAt);
        console.log('[NextAuth] Has refresh token:', !!(user as any).refreshToken);
        return {
          ...token,
          accessToken: (user as any).accessToken,
          refreshToken: (user as any).refreshToken,
          idToken: (user as any).idToken,
          expiresAt: newExpiresAt,
          id: user.id,
        };
      }
      
      // Handle OAuth providers (Keycloak)
      if (account && user) {
        console.log('[NextAuth] OAuth sign in, storing tokens');
        return {
          ...token,
          accessToken: account.access_token,
          refreshToken: account.refresh_token,
          idToken: account.id_token,
          expiresAt: account.expires_at,
          id: user.id,
        };
      }

      // Return previous token if the access token has not expired yet
      const now = Math.floor(Date.now() / 1000);
      const expiresAt = token.expiresAt as number;
      
      // Don't refresh if we don't have an expiresAt or if token is still valid
      if (!expiresAt) {
        console.log('[NextAuth] No expiresAt found, returning token as-is');
        return token;
      }
      
      // Check if token is still valid (with 30 second buffer before expiry)
      if (now < expiresAt - 30) {
        console.log('[NextAuth] Token still valid, expires in', Math.floor((expiresAt - now) / 60), 'minutes');
        return token;
      }

      // Token has expired or is about to expire, try to refresh it
      console.log('[NextAuth] Token expired or expiring soon, refreshing...');
      console.log('[NextAuth] Current time:', now, 'ExpiresAt:', expiresAt);
      return refreshAccessToken(token);
    },
    async session({ session, token }) {
      // Pass all necessary tokens to the client session
      console.log('[NextAuth] Session callback - Has accessToken:', !!token.accessToken);
      (session as any).accessToken = token.accessToken;
      (session as any).idToken = token.idToken;
      (session as any).refreshToken = token.refreshToken;
      (session as any).error = token.error;
      (session as any).expiresAt = token.expiresAt;
      
      if (session.user) {
        session.user = {
          ...session.user,
          id: token.id as string || token.sub,
        };
      }
      return session;
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



