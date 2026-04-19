import { login } from "@/modules/auth/actions";

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50">
      <form action={login} className="w-full max-w-sm space-y-4 rounded-xl border bg-white p-8 shadow-sm">
        <h1 className="text-xl font-semibold">Calculo de Propinas</h1>

        <ErrorMessage searchParams={searchParams} />

        <div className="space-y-3">
          <input
            name="email"
            type="email"
            placeholder="Correo"
            required
            className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black"
          />
          <input
            name="password"
            type="password"
            placeholder="Contrasena"
            required
            className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black"
          />
        </div>

        <button
          type="submit"
          className="w-full rounded-lg bg-black py-2 text-sm text-white hover:bg-gray-800"
        >
          Entrar
        </button>
      </form>
    </main>
  );
}

async function ErrorMessage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  if (!error) return null;
  return (
    <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
  );
}
