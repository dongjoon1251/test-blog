// Vercel Serverless Function — /api/agent
// 프론트가 fetch("/api/agent")로 부르는 서버 함수. API 키는 이 파일 안에서만 사용.
// process.env.OPENAI_API_KEY는 Vercel 대시보드에 등록된 값 (코드·커밋에 절대 넣지 말 것).

import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "POST only" });
  }

  const { notes } = req.body || {};
  if (!Array.isArray(notes) || notes.length === 0) {
    return res.status(400).json({ error: "notes[] 필요" });
  }

  const joined = notes.map((n, i) => `${i + 1}. ${n}`).join("\n");

  try {
    const r = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "너는 따뜻한 코치야. 사용자가 남긴 메모들을 읽고, 3~4문장으로 요약하고 마지막에 짧은 위로 한 문장을 붙여줘." },
        { role: "user", content: `메모들:\n${joined}` }
      ]
    });
    const reply = r.choices[0]?.message?.content?.trim() || "답을 못 만들었어.";
    res.status(200).json({ reply });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "agent failed" });
  }
}
