import { ClerkProvider } from '@clerk/nextjs';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <div className="min-h-screen flex items-center justify-center bg-background">
        {children}
      </div>
    </ClerkProvider>
  );
}