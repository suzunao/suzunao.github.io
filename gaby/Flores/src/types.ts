export interface Hotspot {
  id: string;
  name: string;
  room: string;
  x: number;
  y: number;
  radius: number;
  actionText: string;
  speaker: 'gaby' | 'novio' | 'nolan' | 'michi' | 'narrator';
  storyChapter: number;
}

export interface StoryChapter {
  id: number;
  chapterNumber: number;
  title: string;
  subtitle: string;
  prose: string;
  clueHint?: string;
  solved: boolean;
  requiredFlag?: 'none' | 'flag1' | 'flag2' | 'flag3' | 'all';
  lockedSummary?: string;
  roomTarget?: 'living' | 'bedroom' | 'kitchen' | 'gazebo';
  roomLabel?: string;
  toolTarget?: 'rot3' | 'uv' | 'barista';
  toolName?: string;
  targetFlagNum?: 1 | 2 | 3;
}

export interface DialogueOption {
  text: string;
  action: () => void;
}

export interface StoryDialogue {
  speaker: 'gaby' | 'novio' | 'nolan' | 'michi' | 'narrator';
  speakerName: string;
  avatar: string;
  text: string;
  atmosphere?: string;
  options?: DialogueOption[];
}

export interface GameState {
  currentChapter: number;
  activeTab: 'novel' | 'notebook';
  activeHotspot: Hotspot | null;
  flags: {
    flag1: boolean; // Cinnamon tea solved
    flag2: boolean; // Michi & Stego card solved
    flag3: boolean; // Barista coffee formula solved
  };
  investigated: {
    living: boolean;  // Investigated napkin in living room
    bedroom: boolean; // Investigated white cat & ace in bedroom
    kitchen: boolean; // Investigated espresso machine in kitchen
  };
  toolsTried: {
    rot3: boolean;
    uv: boolean;
    barista: boolean;
  };
  awakened: boolean;
  gardenRevealed: boolean;
  muted: boolean;
}
