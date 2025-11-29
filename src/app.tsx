/** @format */
/** @jsxImportSource hono/jsx */

import { Hono } from "hono";
import { html } from "hono/html";
import { serveStatic } from "@hono/node-server/serve-static";
import { GoogleGenAI } from "@google/genai";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import type { ChatRequest, ChatResponse } from "./types.js";

const freeKey = process.env.GEMINI_API_KEY;
if (!freeKey) {
  throw new Error("GEMINI_API_KEY が設定されていません");
}
const paidKey = process.env.GEMINI_API_KEY_PAID;

const geminiFree = new GoogleGenAI({ apiKey: freeKey });
const geminiPaid = paidKey ? new GoogleGenAI({ apiKey: paidKey }) : null;

const app = new Hono();

// 本番用: /client/* を dist/client から配信
const isProd = process.env.NODE_ENV === "production";
if (isProd) {
  app.use("/client/*", serveStatic({ root: "./dist" }));
}

function Page() {
  const clientScript = isProd ? "/client/client.js" : "/src/client.tsx";
  const clientStyle = isProd ? "/client/client.css" : "";
  const hasPaidKey = !!paidKey;

  return (
    <html lang="ja">
      <head>
        <meta charSet="utf-8" />
        <title>Does it work?</title>
        {clientStyle && html`<link rel="stylesheet" href="${clientStyle}" />`}
      </head>
      <body class="max-w-2xl mx-auto my-10 p-4 font-sans space-y-4">
        <h1 class="text-2xl font-bold">Does it work?</h1>
        <div id="root"></div>
        {/* グローバル変数の埋め込み */}
        <script
          dangerouslySetInnerHTML={{
            __html: `window.HAS_PAID_KEY = ${hasPaidKey};`,
          }}
        />
        <script type="module" src={clientScript}></script>
      </body>
    </html>
  );
}

app.get("/", (c) => c.html(<Page />));

app.post("/api/chat", async (c) => {
  let body: Partial<ChatRequest> | null = null;
  try {
    body = await c.req.json<ChatRequest>();
  } catch {
    body = null;
  }
  const model = body?.model?.trim();
  if (!model) {
    return c.json({ error: "modelは必須です" }, 400);
  }
  const message = body?.message?.trim();
  if (!message) {
    return c.json({ error: "message は必須です" }, 400);
  }
  const paidKeyUse = body?.paidKeyUse ?? false;
  const client = paidKeyUse && geminiPaid ? geminiPaid : geminiFree;

  try {
    const res = await client.models.generateContent({
      model: model,
      contents: message,
    });

    const reply = res.text ?? "";
    return c.json<ChatResponse>({ reply });
  } catch (err: any) {
    console.error(err);
    const status = (err.status || 500) as ContentfulStatusCode;
    return c.json({ error: err.message || "Unknown error" }, status);
  }
});

export default app;
