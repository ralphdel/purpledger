// Pass-through layout for the /onboarding route group.
// Sub-pages like /onboarding/[plan] and /onboarding/page.tsx render their own layouts.
// The split-panel layout is used only by set-password and resend via their own wrappers.
export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
