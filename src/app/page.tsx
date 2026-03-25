import { Suspense } from "react";
import HomePage from "@/lib/pages/home";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <HomePage />
    </Suspense>
  );
}