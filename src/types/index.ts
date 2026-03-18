export interface Verse {
  id: number;
  title: string;
  content: string;
}

export interface TeamMember {
  id: string; // user_name in Supabase
  name: string;
  mandatoryVerses: number[]; // IDs of 3 mandatory verses
  themeColor: string; // Hex color string
}

export interface ProgressData {
  user_name: string;
  completed_verses: number[];
}
