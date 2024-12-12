import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
	return (
		<div className="flex min-h-screen flex-col items-center justify-center bg-gray-50">
			<div className="mb-8 text-center">
				<h1 className="text-2xl font-bold text-gray-900">Sistema de Pedidos</h1>
				<p className="mt-2 text-sm text-gray-600">
					Acesso restrito a usuários autorizados
				</p>
			</div>
			<SignIn
				appearance={{
					elements: {
						formButtonPrimary:
							'bg-blue-600 hover:bg-blue-700 text-sm normal-case',
						footerActionLink: 'hidden',
						formFieldInput:
							'rounded-md border-gray-300 focus:border-blue-500 focus:ring-blue-500',
						card: 'shadow-xl rounded-xl border-0',
						headerTitle: 'text-xl font-semibold',
						headerSubtitle: 'text-gray-600',
					},
				}}
				redirectUrl="/"
			/>
		</div>
	);
}
