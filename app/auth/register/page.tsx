import RegisterForm from "@/components/auth/register-form";

export default function RegisterPage() {
  return (
    <>
      <RegisterForm
        githubEnabled={!!process.env.GITHUB_CLIENT_ID}
        googleEnabled={!!process.env.GOOGLE_CLIENT_ID}
      />
    </>
  );
}