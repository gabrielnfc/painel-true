import { authMiddleware } from "@clerk/nextjs";

// Rotas que não requerem autenticação
const publicRoutes = [
  "/",                // Página inicial
  "/sign-in(.*)",    // Páginas de login
  "/sign-up(.*)",    // Páginas de registro
  "/api/webhook",    // Webhooks base
  "/api/webhook/(.*)", // Sub-rotas de webhook
  "/_next/(.*)",     // Assets do Next.js
  "/favicon.ico",    // Favicon
  "/images/(.*)",    // Imagens públicas
  "/access-denied"   // Página de acesso negado
];

// Rotas que requerem roles específicos
const roleBasedRoutes = {
  "/financial(.*)": ["admin", "financial"],
  "/hr(.*)": ["admin", "hr"],
  "/marketing(.*)": ["admin", "marketing"],
  "/ecommerce/report/(.*)": ["admin", "manager"],
  "/wholesale(.*)": ["admin", "wholesale"]
};

export default authMiddleware({
  publicRoutes: publicRoutes,
  
  ignoredRoutes: [
    "/api/webhook",
    "/api/webhook/(.*)",
    "/_next/(.*)",
    "/images/(.*)"
  ],
  
  async afterAuth(auth, req) {
    // Se não estiver autenticado e não for rota pública, redireciona para login
    if (!auth.userId && !auth.isPublicRoute) {
      const signInUrl = new URL('/sign-in', req.url);
      signInUrl.searchParams.set('redirect_url', req.url);
      return Response.redirect(signInUrl);
    }

    // Se estiver autenticado, verifica as restrições de role
    if (auth.userId) {
      const url = new URL(req.url);
      const path = url.pathname;

      // Verifica se a rota atual tem restrições de role
      for (const [route, roles] of Object.entries(roleBasedRoutes)) {
        if (path.match(route)) {
          // Obtém os roles do usuário do Clerk
          const userRoles = (auth.sessionClaims?.roles as string[]) || [];
          
          // Verifica se o usuário tem pelo menos um dos roles necessários
          const hasRequiredRole = roles.some(role => userRoles.includes(role));
          
          if (!hasRequiredRole) {
            // Redireciona para a página de acesso negado
            return Response.redirect(new URL('/access-denied', req.url));
          }
        }
      }
    }

    return null;
  },
});

export const config = {
  matcher: [
    "/(.*)",
    "/((?!.+\\.[\\w]+$|_next).*)",
    "/(api|trpc)(.*)"
  ],
  runtime: 'nodejs'
};