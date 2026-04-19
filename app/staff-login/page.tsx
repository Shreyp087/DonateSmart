import { redirect } from "next/navigation";
import { StaffLoginForm } from "@/components/auth/staff-login-form";
import { PageShell } from "@/components/ui/page-shell";
import { isStaffAuthenticated } from "@/lib/staff-auth";

export default async function StaffLoginPage() {
  if (await isStaffAuthenticated()) {
    redirect("/dashboard");
  }

  return (
    <PageShell className="flex min-h-[70vh] items-center justify-center">
      <section className="w-full max-w-2xl rounded-[2.5rem] border border-black/5 bg-white/82 p-8 shadow-card backdrop-blur sm:p-10">
        <p className="font-mono text-[11px] uppercase tracking-[0.38em] text-slate-500">Staff Access</p>
        <h1 className="mt-3 text-editorial text-5xl font-medium tracking-tight text-slate-950">
          Open the staff desk.
        </h1>
        <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-600">
          The staff desk is where QR lookup, approvals, and inventory flow come together. Sign in to continue into
          the operational view.
        </p>

        <div className="mt-8 rounded-[1.75rem] border border-black/5 bg-slate-50/80 px-5 py-4">
          <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-slate-400">Demo credentials</p>
          <p className="mt-2 text-sm text-slate-600">
            Employee ID: <span className="font-medium">ghost</span>
          </p>
          <p className="text-sm text-slate-600">
            Password: <span className="font-medium">12345</span>
          </p>
        </div>

        <div className="mt-8">
          <StaffLoginForm />
        </div>
      </section>
    </PageShell>
  );
}
