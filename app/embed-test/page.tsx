const MOCK_TOKEN = "mock-jwt-token-12345";

export default function EmbedTestPage() {
  const iframeSrc = `/?token=${encodeURIComponent(MOCK_TOKEN)}`;

  return (
    <main className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-6xl">
        <h1 className="mb-2 text-2xl font-bold text-slate-900">Embed Test</h1>
        <p className="mb-4 text-sm text-slate-600">
          Loading app in an iframe with mock token.
        </p>

        <div className="overflow-hidden rounded-lg border border-slate-300 bg-white shadow-sm">
          <iframe
            title="Horse Racing App Embed"
            src={iframeSrc}
            className="h-[80vh] w-full border-0"
          />
        </div>
      </div>
    </main>
  );
}
