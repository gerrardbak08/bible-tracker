-- =============================================================
-- Migration: 001_church_tables
-- Purpose: Church-wide memorization system (separate from 6-member system)
-- DO NOT modify existing tables: progress
-- =============================================================

-- ─────────────────────────────────────────────────────────────
-- 1. ENABLE ANONYMOUS AUTH
-- =============================================================
-- In Supabase Dashboard → Authentication → Providers → Anonymous Sign-ins
-- Enable: Anonymous sign-ins
-- (Cannot be done via SQL — must be toggled in the dashboard)
-- =============================================================


-- ─────────────────────────────────────────────────────────────
-- 2. TABLE: church_profiles
-- Stores name and affiliation for each anonymous user.
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.church_profiles (
  id          uuid        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name        text        NOT NULL CHECK (char_length(trim(name)) BETWEEN 1 AND 20),
  affiliation text        NOT NULL CHECK (affiliation IN ('1장년', '2장년', '청년부', '중고등부', '초등부')),
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- Auto-update updated_at on row change
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER church_profiles_updated_at
  BEFORE UPDATE ON public.church_profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- ─────────────────────────────────────────────────────────────
-- 3. TABLE: church_verses
-- Canonical verse list for the church-wide flow.
-- Client also uses static data (src/constants/data.ts) for the
-- same IDs — keep in sync if verses change.
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.church_verses (
  id         int         PRIMARY KEY,
  category   text        NOT NULL CHECK (category IN ('guideline', 'secret')),
  title      text        NOT NULL,
  reference  text        NOT NULL,
  content    text        NOT NULL,
  sort_order int         NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Seed: 지침 1–10 (guideline)
INSERT INTO public.church_verses (id, category, title, reference, content, sort_order) VALUES
  (1,  'guideline', '지침1_성령의 해방',                               '롬8:1-2',   '그러므로 이제 그리스도 예수 안에 있는 자에게는 결코 정죄함이 없나니 이는 그리스도 예수 안에 있는 생명의 성령의 법이 죄와 사망의 법에서 너를 해방하였음이라', 1),
  (2,  'guideline', '지침2_생명과 평안으로 이끄시는 성령님',            '롬8:5-8',   '육신을 따르는 자는 육신의 일을, 영을 따르는 자는 영의 일을 생각하나니 육신의 생각은 사망이요 영의 생각은 생명과 평안이니라 육신의 생각은 하나님과 원수가 되나니 이는 하나님의 법에 굴복하지 아니할 뿐 아니라 할 수도 없음이라 육신에 있는 자들은 하나님을 기쁘시게 할 수 없느니라', 2),
  (3,  'guideline', '지침3_성령의 내주로 그리스도인 됨을 확신하라',     '롬8:9',     '만일 너희 속에 하나님의 영이 거하시면 너희가 육신에 있지 아니하고 영에 있나니 누구든지 그리스도의 영이 없으면 그리스도의 사람이 아니라', 3),
  (4,  'guideline', '지침4_성령의 능력을 힘입어 육신의 행실을 죽이라', '롬8:12-14', '그러므로 형제들아 우리가 빚진 자로되 육신에게 져서 육신대로 살 것이 아니니라 너희가 육신대로 살면 반드시 죽을 것이로되 영으로써 몸의 행실을 죽이면 살리니 무릇 하나님의 영으로 인도함을 받는 사람은 곧 하나님의 아들이라', 4),
  (5,  'guideline', '지침5_양자의 영으로 하나님을 아바 아버지라 부르라','롬8:15-16', '너희는 다시 무서워하는 종의 영을 받지 아니하고 양자의 영을 받았으므로 우리가 아빠 아버지라고 부르짖느니라 성령이 친히 우리의 영과 더불어 우리가 하나님의 자녀인 것을 증언하시나니', 5),
  (6,  'guideline', '지침6_고난 속에서도 상속자의 영광된 소망을 붙들라','롬8:18',    '생각하건대 현재의 고난은 장차 우리에게 나타날 영광과 비교할 수 없도다', 6),
  (7,  'guideline', '지침7_성령의 중보로 연약함을 극복하고 담대히 나아가라','롬8:26-27','이와 같이 성령도 우리의 연약함을 도우시나니 우리는 마땅히 기도할 바를 알지 못하나 오직 성령이 말할 수 없는 탄식으로 우리를 위하여 친히 간구하시느니라 마음을 살피시는 이가 성령의 생각을 아시나니 이는 성령이 하나님의 뜻대로 성도를 위하여 간구하심이니라', 7),
  (8,  'guideline', '지침8_하나님의 주권과 선하신 계획을 확신하라',     '롬8:28',    '우리가 알거니와 하나님을 사랑하는 자 곧 그의 뜻대로 부르심을 입은 자들에게는 모든 것이 합력하여 선을 이루느니라', 8),
  (9,  'guideline', '지침9_그리스도 안에서 끊을 수 없는 하나님의 사랑을 확신하라','롬8:38-39','내가 확신하노니 사망이나 생명이나 천사들이나 권세자들이나 현재 일이나 장래 일이나 능력이나 높음이나 깊음이나 다른 어떤 피조물이라도 우리를 우리 주 그리스도 예수 안에 있는 하나님의 사랑에서 끊을 수 없으리라', 9),
  (10, 'guideline', '지침10_성령의 인도하심을 따라 그리스도의 형상을 닮아가라','롬8:29-30','하나님이 미리 아신 자들을 또한 그 아들의 형상을 본받게 하기 위하여 미리 정하셨으니 이는 그로 많은 형제 중에서 맏아들이 되게 하려 하심이니라 또 미리 정하신 그들을 또한 부르시고 부르신 그들을 또한 의롭다 하시고 의롭다 하신 그들을 또한 영화롭게 하셨느니라', 10)
ON CONFLICT (id) DO NOTHING;

-- Seed: 비결 1–8 (secret)
-- Note: 비결3 (id=13) intentionally uses the same text as 지침7 (id=7, 롬8:26-27).
INSERT INTO public.church_verses (id, category, title, reference, content, sort_order) VALUES
  (11, 'secret', '제1비결_성령의 분별 지혜를 훈련하라',     '롬12:2',    '너희는 이 세대를 본받지 말고 오직 마음을 새롭게 함으로 변화를 받아 하나님의 선하시고 기뻐하시고 온전하신 뜻이 무엇인지 분별하도록 하라', 11),
  (12, 'secret', '제2비결_말씀의 등불로 길을 밝히라',       '시119:105', '주의 말씀은 내 발에 등이요 내 길에 빛이니이다', 12),
  (13, 'secret', '제3비결_기도로 주님과 소통하라',           '롬8:26-27', '이와 같이 성령도 우리의 연약함을 도우시나니 우리는 마땅히 기도할 바를 알지 못하나 오직 성령이 말할 수 없는 탄식으로 우리를 위하여 친히 간구하시느니라 마음을 살피시는 이가 성령의 생각을 아시나니 이는 성령이 하나님의 뜻대로 성도를 위하여 간구하심이니라', 13),
  (14, 'secret', '제4비결_영의 생각으로 마음을 조정하라',   '빌2:13-14', '너희 안에서 행하시는 이는 하나님이시니 자기의 기쁘신 뜻을 위하여 너희에게 소원을 두고 행하게 하시나니 모든 일을 원망과 시비가 없이 하라', 14),
  (15, 'secret', '제5비결_환경의 신호에 귀 기울이라',       '행16:10',   '바울이 그 환상을 보았을 때 우리가 곧 마게도냐로 떠나기를 힘쓰니 이는 하나님이 저 사람들에게 복음을 전하라고 우리를 부르신 줄로 인정함이러라', 15),
  (16, 'secret', '제6비결_공동체 안에서 길을 확증하라',     '행15:28',   '성령과 우리는 이 요긴한 것들 외에는 아무 짐도 너희에게 지우지 아니하는 것이 옳은 줄 알았노니', 16),
  (17, 'secret', '제7비결_방해물을 단호히 끊어내라',         '롬8:13-14', '너희가 육신대로 살면 반드시 죽을 것이로되 영으로써 몸의 행실을 죽이면 살리니 무릇 하나님의 영으로 인도함을 받는 사람은 곧 하나님의 아들이라', 17),
  (18, 'secret', '제8비결_확신하고 순종하고 완주하라',       '딤후4:7-8', '나는 선한 싸움을 싸우고 나의 달려갈 길을 마치고 믿음을 지켰으니 이제 후로는 나를 위하여 의의 면류관이 예비되었으므로 주 곧 의로우신 재판장이 그 날에 내게 주실 것이며 내게만 아니라 주의 나타나심을 사모하는 모든 자에게도니라', 18)
ON CONFLICT (id) DO NOTHING;


-- ─────────────────────────────────────────────────────────────
-- 4. TABLE: church_progress
-- One row per (user, verse). Status is NOT array-based.
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.church_progress (
  user_id    uuid        NOT NULL REFERENCES public.church_profiles(id) ON DELETE CASCADE,
  verse_id   int         NOT NULL REFERENCES public.church_verses(id) ON DELETE CASCADE,
  status     text        NOT NULL DEFAULT 'not_started'
               CHECK (status IN ('not_started', 'daily_done', 'mastered')),
  updated_at timestamptz NOT NULL DEFAULT now(),

  PRIMARY KEY (user_id, verse_id)
);


-- ─────────────────────────────────────────────────────────────
-- 5. ROW LEVEL SECURITY
-- ─────────────────────────────────────────────────────────────

-- church_profiles: users can only read/write their own row
ALTER TABLE public.church_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "church_profiles: own row only"
  ON public.church_profiles
  FOR ALL
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- church_verses: any authenticated user can read (including anonymous)
ALTER TABLE public.church_verses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "church_verses: authenticated read"
  ON public.church_verses
  FOR SELECT
  TO authenticated
  USING (true);

-- church_progress: users can only read/write their own progress rows
ALTER TABLE public.church_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "church_progress: own rows only"
  ON public.church_progress
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());


-- ─────────────────────────────────────────────────────────────
-- 6. INDEXES (performance)
-- ─────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS church_progress_user_id_idx ON public.church_progress (user_id);
CREATE INDEX IF NOT EXISTS church_verses_sort_order_idx ON public.church_verses (sort_order);


-- ─────────────────────────────────────────────────────────────
-- VERIFICATION QUERIES (run manually after migration)
-- ─────────────────────────────────────────────────────────────
-- SELECT COUNT(*) FROM church_verses;               -- expected: 18
-- SELECT id, category, title FROM church_verses ORDER BY sort_order;
-- SELECT tablename, rowsecurity FROM pg_tables WHERE tablename LIKE 'church_%';
