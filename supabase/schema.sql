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

-- 4) 서버 함수(/api/add)가 anon 키로 insert 할 수 있게 허용
--    (기존 정책은 authenticated만 insert 가능 → 서버는 익명 세션이 없어 막힘)
create policy "Enable insert for anon (workshop)" on memos for insert to anon with check (true);

-- 5) 정책(RLS)만으론 부족 — anon 역할에 테이블 INSERT 권한(GRANT)도 필요
grant insert on table memos to anon;
