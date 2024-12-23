// ... existing code ...
				keyframes: {
					"accordion-down": {
						from: { height: "0" },
						to: { height: "var(--radix-accordion-content-height)" },
					},
					"accordion-up": {
						from: { height: "var(--radix-accordion-content-height)" },
						to: { height: "0" },
					},
					bounce: {
						'0%, 100%': { transform: 'translateY(0)' },
						'50%': { transform: 'translateY(-4px)' },
					},
				},
				animation: {
					"accordion-down": "accordion-down 0.2s ease-out",
					"accordion-up": "accordion-up 0.2s ease-out",
					bounce: "bounce 1.4s infinite",
				},
// ... existing code ... 