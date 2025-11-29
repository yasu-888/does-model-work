/** @format */
/** @jsxImportSource hono/jsx */

import { render, useState } from "hono/jsx/dom";
import type { ChatRequest, ChatResponse } from "./types.js";
import "./style.css";

function App() {
  const [model, setModel] = useState("");
  const [input, setInput] = useState("");
  const [paidKeyUse, setPaidKeyUse] = useState(false);
  const [reply, setReply] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [latency, setLatency] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // グローバル変数を受け取り
  const hasPaidKey = (window as any).HAS_PAID_KEY;

  const onSubmit = async (e: SubmitEvent) => {
    e.preventDefault();
    if (!model.trim()) return;
    if (!input.trim()) return;
    setLoading(true);
    setError(null);
    setLatency(null);
    const startTime = performance.now();
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ model: model, message: input, paidKeyUse: paidKeyUse } satisfies ChatRequest),
      });
      if (!res.ok) {
        const text = await res.text();
        setError(`エラー: ${res.status} ${text}`);
        setReply(null);
      } else {
        const data: ChatResponse = await res.json();
        const endTime = performance.now();
        setLatency(endTime - startTime);
        setReply(data.reply ?? "(空のレスポンス)");
      }
    } catch (err) {
      console.error(err);
      setError("ネットワークエラーかサーバーエラーが発生しました。");
      setReply(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div class="space-y-4">
      <div class="flex items-center space-x-2">
        <p>Docs: </p>
        <a
          href="https://ai.google.dev/gemini-api/docs/models?hl=ja"
          class="underline text-blue-600"
          target="_blank"
          rel="noopener noreferrer"
        >
          Gemini API
        </a>
      </div>
      <form onSubmit={onSubmit as any} class="space-y-2">
        <div class="flex items-center space-x-2">
          <input
            id="paidKeyUse"
            type="checkbox"
            name="paidKeyUse"
            checked={paidKeyUse}
            onInput={(e) => setPaidKeyUse((e.target as HTMLInputElement).checked)}
            disabled={!hasPaidKey}
          />
          <label
            htmlFor="paidKeyUse"
            class={`block text-sm font-medium ${!hasPaidKey ? "text-gray-500 cursor-not-allowed" : ""}`}
          >
            有料のAPIキーを使用する
          </label>
        </div>
        <label htmlFor="model" class="block text-sm font-medium">
          Gemini のモデルを指定
        </label>
        <input
          id="model"
          name="model"
          class="w-full p-2 border rounded"
          value={model}
          onInput={(e) => setModel((e.target as HTMLTextAreaElement).value)}
          placeholder="gemini-2.5-flash-lite"
        />
        <label htmlFor="message" class="block text-sm font-medium">
          Gemini へのメッセージ
        </label>
        <textarea
          id="message"
          name="message"
          class="w-full min-h-[120px] p-2 border rounded"
          value={input}
          onInput={(e) => setInput((e.target as HTMLTextAreaElement).value)}
          placeholder="例: Honoについて3行で説明して"
        />
        <button
          type="submit"
          class="inline-flex items-center px-3 py-1.5 text-sm font-medium rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
          disabled={loading}
        >
          {loading ? "送信中..." : "送信"}
        </button>
      </form>
      {latency && <div class="text-sm text-gray-500">応答時間: {latency.toFixed(2)} ms</div>}
      {error && <div class="border border-red-300 text-red-800 text-sm p-3 rounded">{error}</div>}
      {reply && !error && <div class="border rounded p-3 text-sm whitespace-pre-wrap bg-gray-50">{reply}</div>}
    </div>
  );
}

const root = document.getElementById("root");
if (!root) {
  throw new Error("#root が見つかりません");
}

render(<App />, root);
