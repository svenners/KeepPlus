import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';

// Default scopes for all standard Google accounts (Drive AppData sync fallback)
const scopes = [
  'openid',
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/drive.appdata',
];

// Only request official Keep API scope if explicitly enabled in a Workspace Enterprise organization
if (process.env.ENABLE_KEEP_ENTERPRISE_SCOPE === 'true') {
  scopes.push('https://www.googleapis.com/auth/keep');
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || 'demo-client-id',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'demo-client-secret',
      authorization: {
        params: {
          prompt: 'consent',
          access_type: 'offline',
          response_type: 'code',
          scope: scopes.join(' '),
        },
      },
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET || 'keepplus-development-secret-key-super-secure',
  callbacks: {
    async jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.expiresAt = account.expires_at;
      }
      return token;
    },
    async session({ session, token }) {
      (session as any).accessToken = token.accessToken;
      return session;
    },
  },
};
