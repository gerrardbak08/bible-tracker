// Bible book abbreviation → full Korean name
// Sorted longest-first to avoid partial match conflicts (e.g. 고전 before 고)
const BIBLE_ABBR: Record<string, string> = {
  // Multi-char abbreviations first
  삼상: "사무엘상", 삼하: "사무엘하",
  왕상: "열왕기상", 왕하: "열왕기하",
  대상: "역대상",   대하: "역대하",
  고전: "고린도전서", 고후: "고린도후서",
  살전: "데살로니가전서", 살후: "데살로니가후서",
  딤전: "디모데전서",   딤후: "디모데후서",
  벧전: "베드로전서",  벧후: "베드로후서",
  요일: "요한일서", 요이: "요한이서", 요삼: "요한삼서",
  // Single-char Old Testament
  창: "창세기", 출: "출애굽기", 레: "레위기", 민: "민수기", 신: "신명기",
  수: "여호수아", 삿: "사사기", 룻: "룻기",
  스: "에스라", 느: "느헤미야", 에: "에스더", 욥: "욥기", 시: "시편",
  잠: "잠언", 전: "전도서", 아: "아가", 사: "이사야", 렘: "예레미야",
  애: "예레미야애가", 겔: "에스겔", 단: "다니엘", 호: "호세아", 욜: "요엘",
  암: "아모스", 옵: "오바댜", 욘: "요나", 미: "미가", 나: "나훔",
  합: "하박국", 습: "스바냐", 학: "학개", 슥: "스가랴", 말: "말라기",
  // Single-char New Testament
  마: "마태복음", 막: "마가복음", 눅: "누가복음", 요: "요한복음",
  행: "사도행전", 롬: "로마서",
  갈: "갈라디아서", 엡: "에베소서", 빌: "빌립보서", 골: "골로새서",
  딛: "디도서", 몬: "빌레몬서", 히: "히브리서", 약: "야고보서",
  유: "유다서", 계: "요한계시록",
};

/**
 * Expand a raw Bible reference string like "롬8:1-2" into natural Korean speech.
 * Handles: single verse (롬8:1) and verse ranges (롬8:1-2).
 */
function expandBibleRef(ref: string): string {
  // Match: (abbreviation)(chapter):(startVerse)[-(endVerse)]
  const match = ref.match(/^([가-힣]+)(\d+):(\d+)(?:-(\d+))?$/);
  if (!match) return ref;

  const [, abbr, chapter, startVerse, endVerse] = match;
  const bookName = BIBLE_ABBR[abbr] ?? abbr;
  const base = `${bookName} ${chapter}장 ${startVerse}절`;
  return endVerse ? `${base}에서 ${endVerse}절` : base;
}

/**
 * Convert TTS input text into natural Korean speech-friendly form.
 * - UI display text is NOT modified — only the text passed to TTS.
 * - Parenthesized Bible refs like (롬8:1-2) → ", 로마서 8장 1절에서 2절"
 * - Underscores → silent (replaced by space)
 * - Digits adjacent to Korean → spaced apart (지침1 → 지침 1)
 */
export function normalizeTextForKoreanTTS(text: string): string {
  let result = text;

  // 1. Expand parenthesized Bible refs: optional leading space + (ref)
  //    e.g. " (롬8:1-2)" → ", 로마서 8장 1절에서 2절"
  result = result.replace(
    /\s*\(([가-힣]+\d+:\d+(?:-\d+)?)\)/g,
    (_, ref) => `, ${expandBibleRef(ref)}`
  );

  // 2. Replace underscores with a space (never read as "밑줄")
  result = result.replace(/_/g, " ");

  // 3. Insert space between Korean characters and adjacent digits
  //    e.g. "지침1" → "지침 1", "제1비결" → "제 1 비결"
  result = result.replace(/([가-힣])(\d)/g, "$1 $2");
  result = result.replace(/(\d)([가-힣])/g, "$1 $2");

  // 4. Collapse multiple spaces
  result = result.replace(/\s+/g, " ").trim();

  return result;
}
