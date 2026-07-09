// Vercel Serverless Function — /api/ask  (RAG: 벡터 검색 + 답변)
// 1) 질문을 임베딩 → 2) Supabase pgvector 유사도 검색(match_memos) → 3) 찾은 메모만 근거로 답변.
// OpenAI 키는 서버에만. Supabase는 anon 키로 검색(match_memos는 공개 SELECT).

import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const supa = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  const { question } = req.body || {};
  if (!question || !question.trim()) return res.status(400).json({ error: "question 필요" });

  try {
    // 1) 질문 임베딩
    const emb = await openai.embeddings.create({ model: "text-embedding-3-small", input: question });
    const qv = emb.data[0].embedding;

    // 2) 벡터 DB 유사도 검색 (Supabase pgvector RPC)
    const { data: hits, error } = await supa.rpc("match_memos", { query_embedding: qv, match_count: 3 });
    if (error) throw error;
    const used = (hits || []).map(h => h.text);
    if (used.length === 0) return res.status(200).json({ answer: "아직 검색할 메모가 없어요. 메모를 먼저 남겨봐.", used: [] });

    // 3) 검색된 메모만 근거로 답변
    const context = used.map((t, i) => `[${i + 1}] ${t}`).join("\n");
    const r = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "너는 사용자의 메모만 근거로 답하는 도우미야. 아래 메모에 없는 내용은 모른다고 말하고, 답에 근거 번호 [n]을 붙여." },
        { role: "user", content: `메모:\n${context}\n\n질문: ${question}` }
      ]
    });
    res.status(200).json({ answer: r.choices[0]?.message?.content?.trim() || "답을 못 만들었어.", used });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "ask failed" });
  }
}
