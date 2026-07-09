// Vercel Serverless Function — /api/config
// Supabase URL과 anon(publishable) 키를 Vercel Env에서 읽어 프론트로 내려준다.
// 이 두 값은 원래 브라우저에 노출돼도 되는 공개 값(RLS로 보호)이지만,
// "키는 코드·커밋에 넣지 않는다" 원칙을 지키려고 env로 분리했다.
// (OpenAI 키처럼 비밀은 아니므로 프론트로 내려줘도 안전.)

export default function handler(req, res) {
  res.status(200).json({
    url: process.env.SUPABASE_URL,
    anonKey: process.env.SUPABASE_ANON_KEY
  });
}
