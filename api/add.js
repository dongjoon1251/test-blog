// Vercel Serverless Function — /api/add
// 메모를 저장할 때 OpenAI 임베딩을 만들어 Supabase(pgvector)에 함께 넣는다.
// 임베딩은 OpenAI 키가 필요해 서버에서만 만든다 → 그래서 insert도 서버 함수로.

import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const supa = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  const { text } = req.body || {};
  if (!text || !text.trim()) return res.status(400).json({ error: "text 필요" });

  try {
    const emb = await openai.embeddings.create({ model: "text-embedding-3-small", input: text });
    // pgvector 컬럼엔 배열이 아니라 "[0.1,0.2,...]" 문자열로 넣어야 PostgREST가 캐스팅한다
    const embedding = JSON.stringify(emb.data[0].embedding);
    const { error } = await supa.from("memos").insert([{ text, embedding }]);
    if (error) throw error;
    res.status(200).json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "add failed" });
  }
}
