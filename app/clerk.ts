import { clerkClient } from "@clerk/nextjs";
import { authMiddleware, auth } from "@clerk/nextjs";

export const clerkConfig = {
  // Configurações específicas do Clerk
  signIn: "/sign-in",
  signUp: "/sign-up",
  afterSignIn: "/dashboard",
  afterSignUp: "/dashboard",
};

export { auth };