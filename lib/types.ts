export type MatchFormat = 'T20' | 'ODI';
export type PitchType = 'Flat' | 'Green' | 'Dusty' | 'Balanced';
export type InningsType = '1st' | '2nd';
export type RiskLevel = 'Low' | 'Medium' | 'High';

export interface Team {
  name: string;
  code: string;
  color: string;
  secondaryColor: string;
  battingStrength: number; // multiplier (e.g. 0.8 - 1.2)
  bowlingStrength: number; // multiplier
}

export interface Venue {
  name: string;
  city: string;
  avgFirstInningsT20: number;
  avgFirstInningsODI: number;
  multiplier: number;
  pitchType: PitchType;
  description: string;
  spinAssist: number; // 1-5
  paceAssist: number; // 1-5
}

export interface BatsmanState {
  name: string;
  runs: number;
  balls: number;
  isStriker: boolean;
  isOut: boolean;
}

export interface BowlerState {
  name: string;
  overs: number;
  runs: number;
  wickets: number;
}

export interface BallHistoryItem {
  overs: number;
  score: number;
  wickets: number;
  winProb?: number;
  projectedScore?: number;
}

export interface MatchState {
  id?: string;
  format: MatchFormat;
  battingTeam: Team;
  bowlingTeam: Team;
  score: number;
  wickets: number;
  overs: number;
  balls: number; // ball index in current over (0 to 5)
  target: number | null; // target for 2nd innings
  currentOverHistory: string[]; // e.g. ["1", "4", "W", "0", "1", "6"]
  striker: BatsmanState;
  nonStriker: BatsmanState;
  bowler: BowlerState;
  venue: Venue;
  pitchType: PitchType;
  innings: InningsType;
  history: BallHistoryItem[];
}

export interface PredictionResult {
  projectedScore: number;
  projectedRange: [number, number];
  winProbability: number; // 0 to 100
  keyInsights: string[];
  riskLevel: RiskLevel;
  runRateRequired: number | null;
  currentRunRate: number;
}
