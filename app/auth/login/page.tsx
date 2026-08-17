import LoginForm from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <>
      <LoginForm
        githubEnabled={!!process.env.GITHUB_CLIENT_ID}
        googleEnabled={!!process.env.GOOGLE_CLIENT_ID}
      />
    </>
  );
}