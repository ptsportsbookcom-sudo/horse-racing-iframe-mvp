"use client";

import { useEffect, useRef, useState } from "react";

const MOCK_TOKEN = "mock-jwt-token-12345";

type IframeMessage = {
  type: string;
  payload?: unknown;
};

export default function EmbedTestPage() {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [mockBalance, setMockBalance] = useState(100);
  const iframeSrc = `/?token=${encodeURIComponent(MOCK_TOKEN)}&v=2`;

  function postToIframe(message: IframeMessage) {
    if (!iframeRef.current?.contentWindow) {
      return;
    }

    console.log("Parent outgoing message:", message);
    iframeRef.current.contentWindow.postMessage(message, "*");
  }

  function handleIframeLoad() {
    console.log("Iframe loaded");
    postToIframe({ type: "GET_BALANCE" });
    postToIframe({
      type: "BALANCE_UPDATE",
      payload: { balance: mockBalance },
    });
  }

  useEffect(() => {
    const handleMessage = (event: MessageEvent<IframeMessage>) => {
      console.log("Parent incoming message:", event.data);

      if (event.data?.type === "GET_BALANCE") {
        postToIframe({
          type: "BALANCE_UPDATE",
          payload: { balance: mockBalance },
        });
        return;
      }

      if (event.data?.type === "BET_PLACED") {
        const totalStake =
          (event.data.payload as { totalStake?: unknown } | undefined)?.totalStake ?? 0;
        const numericStake = typeof totalStake === "number" ? totalStake : 0;
        const nextBalance = Math.max(0, mockBalance - numericStake);
        setMockBalance(nextBalance);

        postToIframe({
          type: "BET_PLACED",
          payload: event.data.payload,
        });
        postToIframe({
          type: "BALANCE_UPDATE",
          payload: { balance: nextBalance },
        });
      }
    };

    window.addEventListener("message", handleMessage);

    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, [mockBalance]);

  return (
    <main className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-6xl">
        <h1 className="mb-2 text-2xl font-bold text-slate-900">Iframe Demo</h1>
        <p className="mb-4 text-sm text-slate-600">
          Loading app in an iframe with mock token.
        </p>

        <div className="overflow-hidden rounded-lg border border-slate-400 bg-white shadow-sm">
          <iframe
            ref={iframeRef}
            title="Horse Racing App Embed"
            src={iframeSrc}
            onLoad={handleIframeLoad}
            className="h-[800px] w-full border"
          />
        </div>
      </div>
    </main>
  );
}
