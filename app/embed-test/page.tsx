const MOCK_TOKEN = "mock-jwt-token-12345";

export default function EmbedTestPage() {
  const iframeSrc = `/?token=${encodeURIComponent(MOCK_TOKEN)}&v=1`;

  return (
    <main className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-6xl">
        <h1 className="mb-2 text-2xl font-bold text-slate-900">Iframe Demo</h1>
        <p className="mb-4 text-sm text-slate-600">
          Loading app in an iframe with mock token.
        </p>

        <div className="overflow-hidden rounded-lg border border-slate-400 bg-white shadow-sm">
          <iframe
            title="Horse Racing App Embed"
            src={iframeSrc}
            onLoad={() => console.log("Iframe loaded")}
            className="h-[800px] w-full border"
          />
        </div>
      </div>
    </main>
  );
}
