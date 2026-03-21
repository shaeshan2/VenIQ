export type ProjectStatus = 'draft' | 'published' | 'archived';

export interface Collaborator {
  id: string;
  name: string;
  avatar: string;
}

export interface Track {
  id: string;
  name: string;
  type: 'vocals' | 'drums' | 'bass' | 'melody' | 'fx' | 'pad';
  color: string;
  waveform: number[]; // Array of values 0-1 for visualization
}

export interface LyricLine {
  id: string;
  text: string;
  startTime: number;
  endTime: number;
  isAI?: boolean;
}

export interface Version {
  id: string;
  title: string;
  duration: string;
  tags: string[];
  date: string;
  status: 'Original' | 'AI Remix' | 'Acoustic' | 'Mastered';
  description?: string;
}

export interface Project {
  id: string;
  title: string;
  songTitle: string;
  genre: string;
  bpm: number;
  key: string;
  lastEdited: string;
  collaborators: Collaborator[];
  status: ProjectStatus;
  tracks: Track[];
  lyrics: LyricLine[];
  versions: Version[];
}

export interface CopilotMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface PromptSuggestion {
  id: string;
  text: string;
  category: 'compose' | 'edit' | 'remix' | 'lyrics' | 'master';
}
