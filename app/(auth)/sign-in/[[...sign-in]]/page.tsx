import { SignIn } from '@clerk/nextjs';
import Image from 'next/image';

export default function SignInPage() {
	return (
		<div className="min-h-screen w-full flex items-center justify-center bg-gray-50">
			<div className="w-full max-w-[1200px] p-4 sm:p-6 md:p-8">
				<div className="flex flex-col items-center space-y-8">
					{/* Logo */}
					<div className="relative w-48 h-16 sm:w-56 sm:h-20">
						<Image
							src="/images/logo-true.svg"
							alt="True Source Logo"
							fill
							className="object-contain"
							priority
						/>
					</div>

					{/* Title and Description */}
					<div className="text-center space-y-2">
						<h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
							Sistema de Pedidos True
						</h1>
						<p className="text-sm sm:text-base text-gray-600">
							Acesso restrito a usuários autorizados
						</p>
					</div>

					{/* Sign In Component */}
					<div className="w-full max-w-sm">
						<SignIn
							appearance={{
								elements: {
									formButtonPrimary:
										'bg-blue-600 hover:bg-blue-700 text-sm normal-case',
									footerActionLink: 'hidden',
									formFieldInput:
										'rounded-md border-gray-300 focus:border-blue-500 focus:ring-blue-500',
									card: 'shadow-xl rounded-xl border-0 bg-white',
									headerTitle: 'text-xl font-semibold text-gray-900',
									headerSubtitle: 'text-gray-600',
									formFieldLabel: 'text-gray-700',
									formFieldLabelRow: 'text-gray-700',
									identityPreviewText: 'text-gray-700',
									formResendCodeLink: 'text-blue-600 hover:text-blue-700',
									otpCodeFieldInput: 'text-gray-900 border-gray-300',
								},
								variables: {
									colorPrimary: '#2563eb',
									colorText: '#111827',
									colorTextSecondary: '#4B5563',
									colorBackground: '#ffffff',
									colorInputText: '#111827',
									colorInputBackground: '#ffffff',
								},
							}}
							redirectUrl="/"
						/>
					</div>
				</div>
			</div>
		</div>
	);
}
