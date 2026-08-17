import { Suspense } from "react";
import StepUpForm from "@/components/auth/step-up-form";

export default function StepUpPage() {
  return (
    <Suspense fallback={null}>
      <StepUpForm />
    </Suspense>
  );
}
