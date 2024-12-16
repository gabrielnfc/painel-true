import { authMiddleware } from "@clerk/nextjs/server";

// Configuração do middleware de autenticação
export default authMiddleware({
  // Apenas a página de login é pública
  publicRoutes: ["/sign-in"],
  
  // Todas as outras rotas requerem autenticação
  afterAuth(auth, req, evt) {
    // Se não estiver autenticado e não for a página de login
    if (!auth.userId && !auth.isPublicRoute) {
      const signInUrl = new URL('/sign-in', req.url);
      signInUrl.searchParams.set('redirect_url', req.url);
      return Response.redirect(signInUrl);
    }
  }
});

// Protege todas as rotas exceto arquivos estáticos
export const config = {
  matcher: [
    "/((?!.*\\.[\\w]+$|_next).*)", // exclui arquivos com extensão
    "/",                            // inclui a raiz
    "/(api|trpc)(.*)",             // inclui rotas de API
  ],
};