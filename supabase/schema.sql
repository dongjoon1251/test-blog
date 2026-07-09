-- RAG 벡터 검색용 Supabase 스키마 (Supabase SQL Editor에서 한 번 실행)
-- text-embedding-3-small = 1536 차원

-- 1) pgvector 확장
create extension if not exists vector;

-- 2) memos 테이블에 임베딩 컬럼 추가
alter table memos add column if not exists embedding vector(1536);

-- 3) 코사인 유사도 top-k 검색 함수
create or replace function match_memos(query_embedding vector(1536), match_count int default 3)
returns table (text text, similarity float)
language sql stable
as $$
  select m.text, 1 - (m.embedding <=> query_embedding) as similarity
  from memos m
  where m.embedding is not null
  order by m.embedding <=> query_embedding
  limit match_count;
$$;
