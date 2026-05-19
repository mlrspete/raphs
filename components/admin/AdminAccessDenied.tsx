import { AdminSignOutButton } from "@/components/admin/AdminSignOutButton";

type AdminAccessDeniedProps = {
  email: string | null;
};

export function AdminAccessDenied({ email }: AdminAccessDeniedProps) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-cream px-5 py-12 text-ink">
      <section className="w-full max-w-lg rounded-lg border border-ink/10 bg-white p-6 shadow-soft sm:p-8">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-orange">Access denied</p>
        <h1 className="mt-3 text-3xl font-black leading-tight text-ink">This account is not an admin.</h1>
        <p className="mt-4 text-base font-semibold leading-7 text-ink/68">
          {email
            ? `${email} is signed in, but it does not have an admin profile for Monroes.`
            : "This account does not have an admin profile for Monroes."}
        </p>
        <div className="mt-6">
          <AdminSignOutButton />
        </div>
      </section>
    </main>
  );
}
