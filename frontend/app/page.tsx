import { redirect } from "next/navigation";

// Root redirect — middleware handles auth, just forward
export default function RootPage() {
  redirect("/dashboard");
}
