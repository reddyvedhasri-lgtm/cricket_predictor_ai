'use client';

import React, { useState, useEffect, useRef } from 'react';
import { TEAMS, VENUES, SQUADS } from '@/lib/constants';
import { predictMatch } from '@/lib/predictor-engine';
import { MatchState, PredictionResult, Team, Venue, PitchType, InningsType, MatchFormat } from '@/lib/types';
import { WinProbabilityGauge, TrendLineChart, ScoreDistributionChart } from '@/components/CustomCharts';
import { Button } from '@/components/ui/button';
import {
  Play, Pause, ChevronRight, RotateCcw, Cpu,
  TrendingUp, MapPin, Sparkles, Info, Volume2, AlertTriangle
} from 'lucide-react';

// Preset simulation matches
const PRESET_MATCHES: MatchState[] = [
  {
    id: 'ind-pak',
    format: 'T20',
    battingTeam: TEAMS[0], // India
    bowlingTeam: TEAMS[3], // Pakistan
    score: 104,
    wickets: 3,
    overs: 12,
    balls: 0,
    target: null,
    currentOverHistory: [],
    striker: { name: 'Virat Kohli', runs: 42, balls: 28, isStriker: true, isOut: false },
    nonStriker: { name: 'Rishabh Pant', runs: 15, balls: 10, isStriker: false, isOut: false },
    bowler: { name: 'Shaheen Afridi', overs: 2, runs: 18, wickets: 1 },
    venue: VENUES[3], // Narendra Modi Stadium
    pitchType: 'Balanced',
    innings: '1st',
    history: [
      { over: 0, score: 0, wickets: 0, projectedScore: 172 },
      { over: 3, score: 28, wickets: 0, projectedScore: 180 },
      { over: 6, score: 52, wickets: 1, projectedScore: 178 },
      { over: 9, score: 76, wickets: 2, projectedScore: 175 },
      { over: 12, score: 104, wickets: 3, projectedScore: 176 }
    ] as any[]
  },
  {
    id: 'csk-mi',
    format: 'T20',
    battingTeam: TEAMS[6], // CSK
    bowlingTeam: TEAMS[7], // MI
    score: 132,
    wickets: 4,
    overs: 14,
    balls: 3,
    target: 182,
    currentOverHistory: ['1', '4', 'W'],
    striker: { name: 'Shivam Dube', runs: 8, balls: 5, isStriker: true, isOut: false },
    nonStriker: { name: 'Ruturaj Gaikwad', runs: 56, balls: 38, isStriker: false, isOut: false },
    bowler: { name: 'Jasprit Bumrah', overs: 2.3, runs: 14, wickets: 2 },
    venue: VENUES[1], // Wankhede
    pitchType: 'Flat',
    innings: '2nd',
    history: [
      { over: 0, score: 0, wickets: 0, winProb: 40 },
      { over: 3, score: 24, wickets: 1, winProb: 35 },
      { over: 6, score: 55, wickets: 1, winProb: 50 },
      { over: 9, score: 82, wickets: 2, winProb: 55 },
      { over: 12, score: 110, wickets: 3, winProb: 65 },
      { over: 14, score: 127, wickets: 3, winProb: 70 }
    ] as any[]
  },
  {
    id: 'aus-eng',
    format: 'ODI',
    battingTeam: TEAMS[1], // Australia
    bowlingTeam: TEAMS[2], // England
    score: 205,
    wickets: 4,
    overs: 38,
    balls: 0,
    target: null,
    currentOverHistory: [],
    striker: { name: 'Mitchell Marsh', runs: 78, balls: 85, isStriker: true, isOut: false },
    nonStriker: { name: 'Glenn Maxwell', runs: 18, balls: 11, isStriker: false, isOut: false },
    bowler: { name: 'Adil Rashid', overs: 8, runs: 42, wickets: 2 },
    venue: VENUES[5], // Lord's
    pitchType: 'Green',
    innings: '1st',
    history: [
      { over: 0, score: 0, wickets: 0, projectedScore: 255 },
      { over: 10, score: 55, wickets: 1, projectedScore: 260 },
      { over: 20, score: 108, wickets: 2, projectedScore: 265 },
      { over: 30, score: 154, wickets: 3, projectedScore: 262 },
      { over: 38, score: 205, wickets: 4, projectedScore: 268 }
    ] as any[]
  }
];

export default function Home() {
  const [activeTab, setActiveTab] = useState<'simulator' | 'predictor' | 'venues' | 'analytics' | 'help'>('simulator');
  
  // Simulator State
  const [selectedPresetId, setSelectedPresetId] = useState('ind-pak');
  const [simMatchState, setSimMatchState] = useState<MatchState>(JSON.parse(JSON.stringify(PRESET_MATCHES[0])));
  const [simPrediction, setSimPrediction] = useState<PredictionResult | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [simulationSpeed, setSimulationSpeed] = useState(2000); // ms per ball
  const [commentary, setCommentary] = useState<string[]>([
    'Match initialized. Press Play to start the ball-by-ball live simulation.'
  ]);
  
  // Predictor Inputs (Manual State)
  const [format, setFormat] = useState<MatchFormat>('T20');
  const [innings, setInnings] = useState<InningsType>('1st');
  const [batTeam, setBatTeam] = useState<Team>(TEAMS[0]);
  const [bowTeam, setBowTeam] = useState<Team>(TEAMS[1]);
  const [venue, setVenue] = useState<Venue>(VENUES[0]);
  const [pitchType, setPitchType] = useState<PitchType>('Flat');
  const [score, setScore] = useState<number>(85);
  const [wickets, setWickets] = useState<number>(2);
  const [overs, setOvers] = useState<number>(10);
  const [balls, setBalls] = useState<number>(0);
  const [target, setTarget] = useState<number>(170);
  const [strikerRuns, setStrikerRuns] = useState<number>(35);
  const [strikerBalls, setStrikerBalls] = useState<number>(24);
  const [isStrikerSettled, setIsStrikerSettled] = useState<boolean>(true);
  const [manualPrediction, setManualPrediction] = useState<PredictionResult | null>(null);

  // Venue state
  const [selectedVenue, setSelectedVenue] = useState<Venue>(VENUES[0]);

  // Audio effects enabled?
  const [audioEnabled, setAudioEnabled] = useState(false);

  // Playback timer ref
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const commentaryEndRef = useRef<HTMLDivElement | null>(null);

  // Initialize prediction on load and reset
  useEffect(() => {
    runManualPrediction();
  }, [format, innings, batTeam, bowTeam, venue, pitchType, score, wickets, overs, balls, target, strikerRuns, strikerBalls, isStrikerSettled]);

  useEffect(() => {
    const initialSim = PRESET_MATCHES.find(m => m.id === selectedPresetId);
    if (initialSim) {
      const cloned = JSON.parse(JSON.stringify(initialSim));
      setSimMatchState(cloned);
      const pred = predictMatch(cloned);
      setSimPrediction(pred);
      setCommentary([`Match initialized: ${cloned.battingTeam.name} vs ${cloned.bowlingTeam.name} at ${cloned.venue.name}.`]);
      setIsPlaying(false);
    }
  }, [selectedPresetId]);

  // Auto-scroll commentary
  useEffect(() => {
    commentaryEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [commentary]);

  // Play/Pause handler
  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        simulateNextBall();
      }, simulationSpeed);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, simMatchState, simulationSpeed]);

  const speakText = (text: string) => {
    if (!audioEnabled || typeof window === 'undefined' || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.1;
    window.speechSynthesis.speak(utterance);
  };

  // Run prediction for manual inputs
  const runManualPrediction = () => {
    const dummyState: MatchState = {
      format,
      battingTeam: batTeam,
      bowlingTeam: bowTeam,
      score,
      wickets,
      overs,
      balls,
      target: innings === '2nd' ? target : null,
      currentOverHistory: [],
      striker: { name: 'Striker', runs: strikerRuns, balls: strikerBalls, isStriker: true, isOut: false },
      nonStriker: { name: 'Non-Striker', runs: 12, balls: 8, isStriker: false, isOut: false },
      bowler: { name: 'Bowler', overs: 2, runs: 15, wickets: 0 },
      venue,
      pitchType,
      innings,
      history: []
    };
    
    // Add bonus calculation for batsman settled
    if (isStrikerSettled) {
      dummyState.battingTeam = {
        ...batTeam,
        battingStrength: batTeam.battingStrength * 1.05
      };
    }
    
    const pred = predictMatch(dummyState);
    setManualPrediction(pred);
  };

  // Simulate a single ball in live simulator
  const simulateNextBall = () => {
    const totalOvers = simMatchState.format === 'T20' ? 20 : 50;
    const totalBalls = totalOvers * 6;
    const currentBallsCount = simMatchState.overs * 6 + simMatchState.balls;

    // Check if match ended
    if (simMatchState.wickets >= 10 || currentBallsCount >= totalBalls || 
        (simMatchState.innings === '2nd' && simMatchState.target && simMatchState.score >= simMatchState.target)) {
      setIsPlaying(false);
      let matchOutcome = '';
      if (simMatchState.innings === '2nd' && simMatchState.target) {
        if (simMatchState.score >= simMatchState.target) {
          matchOutcome = `🎉 ${simMatchState.battingTeam.name} won by ${10 - simMatchState.wickets} wickets!`;
        } else {
          matchOutcome = `🏏 ${simMatchState.bowlingTeam.name} won by ${simMatchState.target - 1 - simMatchState.score} runs!`;
        }
      } else {
        matchOutcome = `🏏 Innings complete! Final Score: ${simMatchState.score}/${simMatchState.wickets} in ${simMatchState.overs} overs.`;
      }
      setCommentary(prev => [...prev, `🔴 MATCH OVER! ${matchOutcome}`]);
      speakText(`Match over. ${matchOutcome}`);
      return;
    }

    // Get current bowler and squad
    const battingSquad = SQUADS[simMatchState.battingTeam.code]?.batsmen || ['Batsman A', 'Batsman B'];
    const bowlingSquad = SQUADS[simMatchState.bowlingTeam.code]?.bowlers || ['Bowler A', 'Bowler B'];

    // Random ball simulation
    const rand = Math.random();
    let runs = 0;
    let isWicket = false;
    let ballDesc = '';

    // Advanced simulator logic
    let dotProb = 0.32;
    let singleProb = 0.38;
    let doubleProb = 0.08;
    let boundary4Prob = 0.12;
    let boundary6Prob = 0.06;
    let wicketProb = 0.04;

    const isDeath = simMatchState.format === 'T20' ? simMatchState.overs >= 16 : simMatchState.overs >= 40;
    if (isDeath) {
      boundary6Prob += 0.08;
      dotProb -= 0.10;
      wicketProb += 0.04;
    }

    const sum = dotProb + singleProb + doubleProb + boundary4Prob + boundary6Prob + wicketProb;
    const pick = rand * sum;

    if (pick < dotProb) {
      runs = 0;
      ballDesc = 'No run. Dot ball, beaten the batsman outside off.';
    } else if (pick < dotProb + singleProb) {
      runs = 1;
      ballDesc = '1 run. Driven down to long-on for a quick single.';
    } else if (pick < dotProb + singleProb + doubleProb) {
      runs = 2;
      ballDesc = '2 runs. Placed in the gap at deep mid-wicket, excellent running.';
    } else if (pick < dotProb + singleProb + doubleProb + boundary4Prob) {
      runs = 4;
      ballDesc = 'FOUR! Crack! Drilled through covers. Spectacular boundary.';
    } else if (pick < dotProb + singleProb + doubleProb + boundary4Prob + boundary6Prob) {
      runs = 6;
      ballDesc = 'SIX! Insane shot! Launched straight over bowler\'s head, into the crowd!';
    } else {
      isWicket = true;
      ballDesc = 'OUT! Wicket falls! Caught at deep square leg! Huge wicket!';
    }

    // Update match state copy
    const nextState = { ...simMatchState };
    nextState.balls += 1;
    
    let ballNotation = runs.toString();
    if (isWicket) ballNotation = 'W';
    if (runs === 4) ballNotation = '4';
    if (runs === 6) ballNotation = '6';
    nextState.currentOverHistory = [...nextState.currentOverHistory, ballNotation];

    if (isWicket) {
      nextState.wickets += 1;
      nextState.striker = {
        name: battingSquad[Math.min(battingSquad.length - 1, nextState.wickets + 1)],
        runs: 0,
        balls: 0,
        isStriker: true,
        isOut: false
      };
      speakText(`Out! Wicket down!`);
    } else {
      nextState.score += runs;
      nextState.striker.runs += runs;
      nextState.striker.balls += 1;
      
      if (runs === 1 || runs === 3) {
        const temp = nextState.striker;
        nextState.striker = { ...nextState.nonStriker, isStriker: true };
        nextState.nonStriker = { ...temp, isStriker: false };
      }

      if (runs === 4 || runs === 6) {
        speakText(`${runs === 6 ? 'Sixer!' : 'Four runs!'}`);
      }
    }

    if (nextState.balls >= 6) {
      nextState.overs += 1;
      nextState.balls = 0;
      nextState.currentOverHistory = [];
      
      const temp = nextState.striker;
      nextState.striker = { ...nextState.nonStriker, isStriker: true };
      nextState.nonStriker = { ...temp, isStriker: false };
      
      const randomBowler = bowlingSquad[Math.floor(Math.random() * bowlingSquad.length)];
      nextState.bowler = {
        name: randomBowler,
        overs: 0,
        runs: 0,
        wickets: 0
      };
      
      ballDesc += ` [Over ${nextState.overs} completed]`;
    }

    const newPrediction = predictMatch(nextState);
    const nextHistory = [...nextState.history];
    if (nextState.balls === 0 || nextState.overs === totalOvers || nextState.wickets >= 10) {
      nextHistory.push({
        over: nextState.overs,
        score: nextState.score,
        wickets: nextState.wickets,
        projectedScore: newPrediction.projectedScore,
        winProb: newPrediction.winProbability
      });
    }
    nextState.history = nextHistory;

    setSimMatchState(nextState);
    setSimPrediction(newPrediction);

    const overBallsText = `${nextState.overs}.${nextState.balls}`;
    const scoreText = `${nextState.score}/${nextState.wickets}`;
    setCommentary(prev => [
      ...prev,
      `[${overBallsText}] (${scoreText}) ${nextState.bowler.name} to ${nextState.striker.name}: ${ballDesc}`
    ]);
  };

  const resetSimulator = () => {
    const initialSim = PRESET_MATCHES.find(m => m.id === selectedPresetId);
    if (initialSim) {
      const cloned = JSON.parse(JSON.stringify(initialSim));
      setSimMatchState(cloned);
      const pred = predictMatch(cloned);
      setSimPrediction(pred);
      setCommentary([`Match reset. Ready for live predictions.`]);
      setIsPlaying(false);
    }
  };

  return (
    <main className="min-h-screen bg-green-50/50 text-zinc-900 flex flex-col font-sans select-none antialiased overflow-x-hidden">
      {/* Background decoration elements (Vibrant cricket field green blur effects) */}
      <div className="fixed top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-emerald-400/20 rounded-full blur-[100px] pointer-events-none animate-pulse" style={{ animationDuration: '4s' }} />
      <div className="fixed bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] bg-green-500/15 rounded-full blur-[100px] pointer-events-none animate-pulse" style={{ animationDuration: '6s' }} />

      {/* HEADER SECTION */}
      <header className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-lg border-b border-green-200 py-3.5 px-6 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 bg-gradient-to-br from-green-600 to-emerald-800 rounded-full shadow-[0_0_15px_rgba(16,185,129,0.4)] animate-bounce" style={{ animationDuration: '2s' }}>
            <TrendingUp className="w-5 h-5 text-white font-bold" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-400 rounded-full animate-ping" />
          </div>
          <div>
            <h1 className="font-black text-lg tracking-tight bg-gradient-to-r from-emerald-800 via-teal-700 to-emerald-800 bg-clip-text text-transparent">
              CRICKET PREDICTOR AI
            </h1>
            <p className="text-[10px] text-emerald-700 font-extrabold uppercase tracking-widest">
              Live Score & win probability engine
            </p>
          </div>
        </div>

        {/* Global tab navigation */}
        <nav className="hidden md:flex bg-white/50 backdrop-blur-md p-1 rounded-full border border-green-200 shadow-sm">
          <button
            onClick={() => setActiveTab('simulator')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold tracking-wide transition-all duration-300 ${
              activeTab === 'simulator'
                ? 'bg-gradient-to-r from-emerald-600 to-green-600 text-white shadow-md transform scale-105'
                : 'text-zinc-600 hover:text-green-700 hover:bg-green-50'
            }`}
          >
            🏟️ Live Simulator
          </button>
          <button
            onClick={() => setActiveTab('predictor')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold tracking-wide transition-all duration-300 ${
              activeTab === 'predictor'
                ? 'bg-gradient-to-r from-emerald-600 to-green-600 text-white shadow-md transform scale-105'
                : 'text-zinc-600 hover:text-green-700 hover:bg-green-50'
            }`}
          >
            🔮 Manual Calculator
          </button>
          <button
            onClick={() => setActiveTab('venues')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold tracking-wide transition-all duration-300 ${
              activeTab === 'venues'
                ? 'bg-gradient-to-r from-emerald-600 to-green-600 text-white shadow-md transform scale-105'
                : 'text-zinc-600 hover:text-green-700 hover:bg-green-50'
            }`}
          >
            🏟️ Stadiums
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold tracking-wide transition-all duration-300 ${
              activeTab === 'analytics'
                ? 'bg-gradient-to-r from-emerald-600 to-green-600 text-white shadow-md transform scale-105'
                : 'text-zinc-600 hover:text-green-700 hover:bg-green-50'
            }`}
          >
            📊 Deep Dive
          </button>
          <button
            onClick={() => setActiveTab('help')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold tracking-wide transition-all duration-300 ${
              activeTab === 'help'
                ? 'bg-gradient-to-r from-emerald-600 to-green-600 text-white shadow-md transform scale-105'
                : 'text-zinc-600 hover:text-green-700 hover:bg-green-50'
            }`}
          >
            📖 How it Works
          </button>
        </nav>

        {/* Action icons */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setAudioEnabled(!audioEnabled)}
            title="Toggle Live Commentary Speech"
            className={`p-2 rounded-lg border transition-all ${
              audioEnabled
                ? 'bg-emerald-50 border-emerald-600 text-white shadow-sm'
                : 'bg-white border-zinc-200 text-zinc-650 hover:text-zinc-900'
            }`}
          >
            <Volume2 className="w-4 h-4" />
          </button>

          <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-250 text-[10px] font-bold uppercase rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" /> Live Analysis Mode
          </span>
        </div>
      </header>

      {/* MOBILE NAVIGATION */}
      <div className="md:hidden flex overflow-x-auto bg-white/80 backdrop-blur-md border-b border-green-200 p-2 items-center gap-2 sticky top-[60px] z-40 scrollbar-none">
        <button
          onClick={() => setActiveTab('simulator')}
          className={`flex-none px-4 py-2 text-xs font-bold rounded-full whitespace-nowrap transition-all duration-300 ${
            activeTab === 'simulator' ? 'bg-gradient-to-r from-emerald-600 to-green-600 text-white shadow-md transform scale-105' : 'text-zinc-600 hover:bg-green-50'
          }`}
        >
          🏟️ Simulator
        </button>
        <button
          onClick={() => setActiveTab('predictor')}
          className={`flex-none px-4 py-2 text-xs font-bold rounded-full whitespace-nowrap transition-all duration-300 ${
            activeTab === 'predictor' ? 'bg-gradient-to-r from-emerald-600 to-green-600 text-white shadow-md transform scale-105' : 'text-zinc-600 hover:bg-green-50'
          }`}
        >
          🔮 Manual Calculator
        </button>
        <button
          onClick={() => setActiveTab('venues')}
          className={`flex-none px-4 py-2 text-xs font-bold rounded-full whitespace-nowrap transition-all duration-300 ${
            activeTab === 'venues' ? 'bg-gradient-to-r from-emerald-600 to-green-600 text-white shadow-md transform scale-105' : 'text-zinc-600 hover:bg-green-50'
          }`}
        >
          🏟️ Stadiums
        </button>
        <button
          onClick={() => setActiveTab('analytics')}
          className={`flex-none px-4 py-2 text-xs font-bold rounded-full whitespace-nowrap transition-all duration-300 ${
            activeTab === 'analytics' ? 'bg-gradient-to-r from-emerald-600 to-green-600 text-white shadow-md transform scale-105' : 'text-zinc-600 hover:bg-green-50'
          }`}
        >
          📊 Deep Dive
        </button>
        <button
          onClick={() => setActiveTab('help')}
          className={`flex-none px-4 py-2 text-xs font-bold rounded-full whitespace-nowrap transition-all duration-300 ${
            activeTab === 'help' ? 'bg-gradient-to-r from-emerald-600 to-green-600 text-white shadow-md transform scale-105' : 'text-zinc-600 hover:bg-green-50'
          }`}
        >
          📖 Help
        </button>
      </div>

      {/* MAIN CONTAINER */}
      <div className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-6 overflow-y-auto">
        
        {/* =======================================================
            TAB 1: LIVE SIMULATOR VIEW
            ==========        {/* =======================================================
            TAB 1: LIVE SIMULATOR VIEW (MATCH CENTER DASHBOARD)
            ======================================================= */}
        {activeTab === 'simulator' && (
          <div className="flex flex-col gap-6">
            <div className="bg-white/90 backdrop-blur-sm border border-green-150 rounded-2xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] text-emerald-800 font-extrabold tracking-wider uppercase bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                  🏟️ Match Center
                </span>
                <h2 className="text-xl font-bold text-zinc-800 mt-1.5">Live Match Simulation Arena</h2>
                <p className="text-xs text-zinc-500 mt-0.5">Select a live match scenario to track win probabilities and score projections in a new window.</p>
              </div>
              <span className="flex items-center gap-2 px-3 py-1.5 bg-red-50 border border-red-200 text-[10px] font-black text-red-700 uppercase rounded-full self-start md:self-auto animate-pulse">
                <span className="w-2 h-2 bg-red-600 rounded-full" /> 3 Matches Live
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* MATCH CARD 1: IND vs PAK */}
              <div className="bg-white/90 backdrop-blur-sm border border-green-100 rounded-2xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.03)] flex flex-col justify-between gap-6 transition-all duration-300 hover:shadow-[0_12px_40px_rgba(0,0,0,0.06)] hover:-translate-y-1 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 rounded-full blur-xl group-hover:scale-150 transition-all duration-500" />
                
                <div className="flex flex-col gap-4">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] bg-red-50 text-red-750 border border-red-100 px-2 py-0.5 font-bold uppercase rounded-md tracking-wider flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 bg-red-650 rounded-full animate-ping" /> Live
                    </span>
                    <span className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-widest">T20 World Cup</span>
                  </div>

                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-blue-650 border border-zinc-200" />
                        <span className="font-extrabold text-sm text-zinc-800">India</span>
                      </div>
                      <span className="font-black text-sm text-zinc-800">104/3 <span className="text-[10px] text-zinc-400 font-semibold">(12.0 ov)</span></span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-emerald-650 border border-zinc-200" />
                        <span className="font-bold text-sm text-zinc-500">Pakistan</span>
                      </div>
                      <span className="text-xs text-zinc-400 font-bold">Yet to Bat</span>
                    </div>
                  </div>

                  <hr className="border-zinc-100" />

                  <div className="flex flex-col gap-1.5 text-xs text-zinc-505">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-green-700" />
                      <span className="font-semibold text-zinc-650">Narendra Modi Stadium</span>
                    </div>
                    <div className="text-[10px] text-zinc-400 ml-5 font-semibold">Pitch: Balanced | 1st Innings</div>
                  </div>
                </div>

                <a
                  href="/live?match=ind-pak"
                  target="_blank"
                  className="w-full py-2.5 bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-500 hover:to-emerald-650 text-white rounded-xl font-bold text-xs text-center shadow-[0_4px_12px_rgba(16,185,129,0.25)] transition-all duration-300 transform active:scale-95 flex items-center justify-center gap-2"
                >
                  🏟️ Launch Live Match Tracker
                </a>
              </div>

              {/* MATCH CARD 2: CSK vs MI */}
              <div className="bg-white/90 backdrop-blur-sm border border-green-100 rounded-2xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.03)] flex flex-col justify-between gap-6 transition-all duration-300 hover:shadow-[0_12px_40px_rgba(0,0,0,0.06)] hover:-translate-y-1 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-amber-500/10 to-blue-500/10 rounded-full blur-xl group-hover:scale-150 transition-all duration-500" />
                
                <div className="flex flex-col gap-4">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] bg-red-50 text-red-750 border border-red-100 px-2 py-0.5 font-bold uppercase rounded-md tracking-wider flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 bg-red-650 rounded-full animate-ping" /> Live
                    </span>
                    <span className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-widest">IPL Derby</span>
                  </div>

                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-blue-700 border border-zinc-200" />
                        <span className="font-bold text-sm text-zinc-500">Mumbai Indians</span>
                      </div>
                      <span className="font-semibold text-xs text-zinc-550">181/6 <span className="text-[10px] text-zinc-400 font-semibold">(20.0 ov)</span></span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-amber-400 border border-zinc-200" />
                        <span className="font-extrabold text-sm text-zinc-800">Chennai Super Kings</span>
                      </div>
                      <span className="font-black text-sm text-zinc-800">132/4 <span className="text-[10px] text-zinc-400 font-semibold">(14.3 ov)</span></span>
                    </div>
                  </div>

                  <hr className="border-zinc-100" />

                  <div className="flex flex-col gap-1.5 text-xs text-zinc-505">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-green-700" />
                      <span className="font-semibold text-zinc-650">Wankhede Stadium</span>
                    </div>
                    <div className="text-[10px] text-zinc-400 ml-5 font-semibold">Pitch: Flat | CSK Needs 50 runs in 33 balls</div>
                  </div>
                </div>

                <a
                  href="/live?match=csk-mi"
                  target="_blank"
                  className="w-full py-2.5 bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-500 hover:to-emerald-650 text-white rounded-xl font-bold text-xs text-center shadow-[0_4px_12px_rgba(16,185,129,0.25)] transition-all duration-300 transform active:scale-95 flex items-center justify-center gap-2"
                >
                  🏟️ Launch Live Match Tracker
                </a>
              </div>

              {/* MATCH CARD 3: AUS vs ENG */}
              <div className="bg-white/90 backdrop-blur-sm border border-green-100 rounded-2xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.03)] flex flex-col justify-between gap-6 transition-all duration-300 hover:shadow-[0_12px_40px_rgba(0,0,0,0.06)] hover:-translate-y-1 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-yellow-500/10 to-red-500/10 rounded-full blur-xl group-hover:scale-150 transition-all duration-500" />
                
                <div className="flex flex-col gap-4">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] bg-red-50 text-red-750 border border-red-100 px-2 py-0.5 font-bold uppercase rounded-md tracking-wider flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 bg-red-650 rounded-full animate-ping" /> Live
                    </span>
                    <span className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-widest">ODI Ashes</span>
                  </div>

                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-yellow-500 border border-zinc-200" />
                        <span className="font-extrabold text-sm text-zinc-800">Australia</span>
                      </div>
                      <span className="font-black text-sm text-zinc-800">205/4 <span className="text-[10px] text-zinc-400 font-semibold">(38.0 ov)</span></span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-sky-800 border border-zinc-200" />
                        <span className="font-bold text-sm text-zinc-500">England</span>
                      </div>
                      <span className="text-xs text-zinc-400 font-bold">Yet to Bat</span>
                    </div>
                  </div>

                  <hr className="border-zinc-100" />

                  <div className="flex flex-col gap-1.5 text-xs text-zinc-505">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-green-700" />
                      <span className="font-semibold text-zinc-650">Lord's Cricket Ground</span>
                    </div>
                    <div className="text-[10px] text-zinc-400 ml-5 font-semibold">Pitch: Green | 1st Innings</div>
                  </div>
                </div>

                <a
                  href="/live?match=aus-eng"
                  target="_blank"
                  className="w-full py-2.5 bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-500 hover:to-emerald-650 text-white rounded-xl font-bold text-xs text-center shadow-[0_4px_12px_rgba(16,185,129,0.25)] transition-all duration-300 transform active:scale-95 flex items-center justify-center gap-2"
                >
                  🏟️ Launch Live Match Tracker
                </a>
              </div>
            </div>
          </div>
        )}

        {/* =======================================================
            TAB 2: MANUAL PREDICTOR CALCULATOR
            ======================================================= */}
        {activeTab === 'predictor' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* INPUT PANEL */}
            <div className="lg:col-span-2 bg-white/90 backdrop-blur-sm border border-green-100 rounded-2xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col gap-6 transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
              <div>
                <h2 className="text-lg font-bold text-zinc-800 flex items-center gap-1.5">
                  <Sparkles className="w-5 h-5 text-emerald-650" /> Manual Scenario Calculator
                </h2>
                <p className="text-xs text-zinc-550 mt-1">Adjust sliders and variables to see simulated predictions and evaluate outcomes.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Format selection */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase">Match Format</label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => { setFormat('T20'); setOvers(Math.min(19, overs)); }}
                      className={`flex-1 py-2 text-xs font-bold rounded-xl border transition-all duration-300 ${
                        format === 'T20'
                          ? 'bg-gradient-to-r from-green-50 to-emerald-100 border-green-500 text-green-900 shadow-md transform scale-[1.02]'
                          : 'bg-white border-zinc-200 text-zinc-600 hover:border-green-300 hover:bg-green-50/50'
                      }`}
                    >
                      T20 (20 Overs)
                    </button>
                    <button
                      onClick={() => { setFormat('ODI'); }}
                      className={`flex-1 py-2 text-xs font-bold rounded-xl border transition-all duration-300 ${
                        format === 'ODI'
                          ? 'bg-gradient-to-r from-green-50 to-emerald-100 border-green-500 text-green-900 shadow-md transform scale-[1.02]'
                          : 'bg-white border-zinc-200 text-zinc-600 hover:border-green-300 hover:bg-green-50/50'
                      }`}
                    >
                      ODI (50 Overs)
                    </button>
                  </div>
                </div>

                {/* Innings selection */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase">Innings</label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setInnings('1st')}
                      className={`flex-1 py-2 text-xs font-bold rounded-xl border transition-all duration-300 ${
                        innings === '1st'
                          ? 'bg-gradient-to-r from-green-50 to-emerald-100 border-green-500 text-green-900 shadow-md transform scale-[1.02]'
                          : 'bg-white border-zinc-200 text-zinc-600 hover:border-green-300 hover:bg-green-50/50'
                      }`}
                    >
                      1st Innings (Score Projection)
                    </button>
                    <button
                      onClick={() => setInnings('2nd')}
                      className={`flex-1 py-2 text-xs font-bold rounded-xl border transition-all duration-300 ${
                        innings === '2nd'
                          ? 'bg-gradient-to-r from-green-50 to-emerald-100 border-green-500 text-green-900 shadow-md transform scale-[1.02]'
                          : 'bg-white border-zinc-200 text-zinc-600 hover:border-green-300 hover:bg-green-50/50'
                      }`}
                    >
                      2nd Innings (Chase Probability)
                    </button>
                  </div>
                </div>
              </div>

              {/* Team selection & venue */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase">Batting Team</label>
                  <select
                    value={batTeam.code}
                    onChange={(e) => setBatTeam(TEAMS.find(t => t.code === e.target.value) || TEAMS[0])}
                    className="bg-white text-xs border border-zinc-300 rounded-lg py-2 px-3 text-zinc-800 focus:outline-none focus:border-emerald-600"
                  >
                    {TEAMS.map((t) => (
                      <option key={t.code} value={t.code}>{t.name} ({t.code})</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase">Bowling Team</label>
                  <select
                    value={bowTeam.code}
                    onChange={(e) => setBowTeam(TEAMS.find(t => t.code === e.target.value) || TEAMS[1])}
                    className="bg-white text-xs border border-zinc-300 rounded-lg py-2 px-3 text-zinc-800 focus:outline-none focus:border-emerald-600"
                  >
                    {TEAMS.filter(t => t.code !== batTeam.code).map((t) => (
                      <option key={t.code} value={t.code}>{t.name} ({t.code})</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase">Stadium / Venue</label>
                  <select
                    value={venue.name}
                    onChange={(e) => setVenue(VENUES.find(v => v.name === e.target.value) || VENUES[0])}
                    className="bg-white text-xs border border-zinc-300 rounded-lg py-2 px-3 text-zinc-800 focus:outline-none focus:border-emerald-600"
                  >
                    {VENUES.map((v) => (
                      <option key={v.name} value={v.name}>{v.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Match Situation Inputs */}
              <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-200 flex flex-col gap-4 shadow-inner">
                <h4 className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Match Situation</h4>
                
                {/* Score & Wickets & Target */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase">Current Score</label>
                    <input
                      type="number"
                      value={score}
                      min={0}
                      max={450}
                      onChange={(e) => setScore(Math.max(0, parseInt(e.target.value) || 0))}
                      className="bg-white border border-zinc-300 rounded-lg py-1.5 px-3 text-xs focus:outline-none focus:border-emerald-500 font-bold text-zinc-800"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase">Wickets Down</label>
                    <select
                      value={wickets}
                      onChange={(e) => setWickets(parseInt(e.target.value))}
                      className="bg-white border border-zinc-300 rounded-lg py-1.5 px-3 text-xs focus:outline-none focus:border-emerald-500 font-bold text-zinc-800"
                    >
                      {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((w) => (
                        <option key={w} value={w}>{w}</option>
                      ))}
                    </select>
                  </div>

                  {innings === '2nd' ? (
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-zinc-500 uppercase">Target Score</label>
                      <input
                        type="number"
                        value={target}
                        min={1}
                        max={450}
                        onChange={(e) => setTarget(Math.max(1, parseInt(e.target.value) || 0))}
                        className="bg-white border border-zinc-300 rounded-lg py-1.5 px-3 text-xs focus:outline-none focus:border-emerald-500 font-bold text-zinc-800"
                      />
                    </div>
                  ) : (
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-zinc-500 uppercase">Pitch Wear / Type</label>
                      <select
                        value={pitchType}
                        onChange={(e) => setPitchType(e.target.value as PitchType)}
                        className="bg-white border border-zinc-300 rounded-lg py-1.5 px-3 text-xs focus:outline-none focus:border-emerald-500 font-bold text-zinc-800"
                      >
                        <option value="Flat">Flat (High scoring)</option>
                        <option value="Balanced">Balanced (Standard)</option>
                        <option value="Green">Green (Pace friendly)</option>
                        <option value="Dusty">Dusty (Spin friendly)</option>
                      </select>
                    </div>
                  )}
                </div>

                {/* Overs & Balls */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between text-[10px] font-bold text-zinc-500 uppercase">
                      <span>Overs Bowled: {overs}</span>
                      <span>Max: {format === 'T20' ? 19 : 49}</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={format === 'T20' ? 19 : 49}
                      value={overs}
                      onChange={(e) => setOvers(parseInt(e.target.value))}
                      className="accent-emerald-600 w-full cursor-pointer h-1.5 bg-zinc-200 rounded-lg"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase">Ball of Over</label>
                    <div className="flex gap-2">
                      {[0, 1, 2, 3, 4, 5].map((b) => (
                        <button
                          key={b}
                          onClick={() => setBalls(b)}
                          className={`flex-1 py-1 text-xs font-bold rounded border transition-all ${
                            balls === b
                              ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                              : 'bg-white border-zinc-300 text-zinc-600 hover:bg-zinc-100'
                          }`}
                        >
                          .{b}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* BATSMAN IN CREASE SETTINGS */}
              <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-200 flex flex-col gap-4 shadow-inner">
                <h4 className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Batsman Condition</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase">Striker Runs</label>
                    <input
                      type="number"
                      value={strikerRuns}
                      min={0}
                      onChange={(e) => setStrikerRuns(Math.max(0, parseInt(e.target.value) || 0))}
                      className="bg-white border border-zinc-300 rounded-lg py-1.5 px-3 text-xs focus:outline-none text-zinc-800 font-bold"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase">Striker Balls Faced</label>
                    <input
                      type="number"
                      value={strikerBalls}
                      min={0}
                      onChange={(e) => setStrikerBalls(Math.max(0, parseInt(e.target.value) || 0))}
                      className="bg-white border border-zinc-300 rounded-lg py-1.5 px-3 text-xs focus:outline-none text-zinc-800 font-bold"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5 justify-center items-center">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase mb-1.5">Is Striker Settled?</label>
                    <button
                      onClick={() => setIsStrikerSettled(!isStrikerSettled)}
                      className={`w-full py-1.5 text-xs font-bold rounded-lg border transition-all ${
                        isStrikerSettled
                          ? 'bg-emerald-50 border-emerald-600 text-emerald-800 shadow-sm font-extrabold'
                          : 'bg-white border-zinc-300 text-zinc-500'
                      }`}
                    >
                      {isStrikerSettled ? '✅ Yes (+5% scoring power)' : '❌ No'}
                    </button>
                  </div>
                </div>
              </div>

            </div>

            {/* PREDICTION PANEL */}
            <div className="flex flex-col gap-6">
              
              {/* DISPLAY CARD */}
              <div className="bg-white/90 backdrop-blur-sm border border-green-100 rounded-2xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col gap-4 relative overflow-hidden transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
                <h3 className="text-xs font-extrabold text-zinc-750 uppercase tracking-wider flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-emerald-600" /> Manual Calculation Result
                </h3>

                {manualPrediction ? (
                  <div className="flex flex-col gap-4">
                    {/* Projection Card */}
                    <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100 shadow-inner">
                      {innings === '1st' ? (
                        <>
                          <div className="text-xs text-emerald-850 font-bold uppercase">Projected score</div>
                          <div className="text-5xl font-black tracking-tight mt-1 text-emerald-700">
                            {manualPrediction.projectedScore}
                          </div>
                          <div className="text-[10px] text-emerald-900 font-bold mt-1">
                            Estimated Interval: {manualPrediction.projectedRange[0]} - {manualPrediction.projectedRange[1]} runs
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="text-xs text-emerald-850 font-bold uppercase">Win Probability</div>
                          <div className="text-5xl font-black tracking-tight mt-1 text-emerald-700">
                            {manualPrediction.winProbability}%
                          </div>
                          <div className="text-[10px] text-emerald-900 font-bold mt-1">
                            {batTeam.name} Chasing Likelihood
                          </div>
                        </>
                      )}
                    </div>

                    {/* Gauges & charts */}
                    {innings === '2nd' && (
                      <WinProbabilityGauge
                        value={manualPrediction.winProbability}
                        batTeamCode={batTeam.code}
                        bowTeamCode={bowTeam.code}
                        batColor={batTeam.color}
                        bowColor={bowTeam.color}
                      />
                    )}

                    {innings === '1st' && (
                      <ScoreDistributionChart
                        projectedScore={manualPrediction.projectedScore}
                        range={manualPrediction.projectedRange}
                        color="#10b981"
                      />
                    )}

                    {/* AI explanation and analysis */}
                    <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-200 flex flex-col gap-2 shadow-inner">
                      <h4 className="text-[10px] font-extrabold text-zinc-500 uppercase tracking-wider">Parameters Evaluated:</h4>
                      <div className="text-[11px] text-zinc-700 flex flex-col gap-1.5">
                        <div className="flex justify-between border-b border-zinc-200 pb-1">
                          <span>CRR (Current Run Rate)</span>
                          <span className="font-bold text-zinc-900">{manualPrediction.currentRunRate.toFixed(2)}</span>
                        </div>
                        {innings === '2nd' && manualPrediction.runRateRequired && (
                          <div className="flex justify-between border-b border-zinc-200 pb-1 text-emerald-800">
                            <span>Required Run Rate (RRR)</span>
                            <span className="font-bold">{manualPrediction.runRateRequired.toFixed(2)}</span>
                          </div>
                        )}
                        <div className="flex justify-between border-b border-zinc-200 pb-1">
                          <span>Venue Multiplier</span>
                          <span className="font-bold text-zinc-900">{venue.multiplier}x</span>
                        </div>
                        <div className="flex justify-between border-b border-zinc-200 pb-1">
                          <span>Wickets down</span>
                          <span className="font-bold text-zinc-900">{wickets}/10</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-zinc-400 text-center py-10">
                    Enter valid scenario stats to compute.
                  </div>
                )}
              </div>

              {/* TACTICAL COACHING INSIGHTS */}
              {manualPrediction && (
                <div className="bg-white/90 backdrop-blur-sm border border-green-100 rounded-2xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col gap-3 transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
                  <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Tactical Insights</h4>
                  <div className="flex flex-col gap-2">
                    {manualPrediction.keyInsights.map((insight, i) => (
                      <div key={i} className="flex gap-2 text-xs bg-zinc-50 p-3 rounded-lg border border-zinc-200 text-zinc-700 shadow-inner">
                        <Info className="w-4 h-4 text-emerald-650 shrink-0 mt-0.5" />
                        <p className="font-medium text-zinc-650">{insight}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>

          </div>
        )}

        {/* =======================================================
            TAB 3: VENUES INTELLIGENCE
            ======================================================= */}
        {activeTab === 'venues' && (
          <div className="flex flex-col gap-6">
            <div className="bg-white/90 backdrop-blur-sm border border-green-100 rounded-2xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
              <h2 className="text-lg font-bold text-zinc-800 flex items-center gap-1.5">
                <MapPin className="w-5 h-5 text-emerald-650" /> Stadium Intelligence & Pitch Reports
              </h2>
              <p className="text-xs text-zinc-550 mt-1">Explore pitch dynamics, weather adjustments, and historical records of major cricket stadiums.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Stadium Selector List */}
              <div className="flex flex-col gap-2">
                {VENUES.map((v) => (
                  <button
                    key={v.name}
                    onClick={() => setSelectedVenue(v)}
                    className={`text-left p-3.5 rounded-xl border transition-all flex flex-col gap-1 ${
                      selectedVenue.name === v.name
                        ? 'bg-emerald-50 border-emerald-600 text-emerald-800 shadow-sm font-extrabold'
                        : 'bg-white border-zinc-200 text-zinc-655 hover:border-zinc-450 hover:bg-zinc-100'
                    }`}
                  >
                    <span className="text-xs font-black tracking-tight">{v.name}</span>
                    <span className="text-[10px] text-zinc-500">{v.city} | Multiplier: {v.multiplier}x</span>
                  </button>
                ))}
              </div>

              {/* Stadium Details Card */}
              <div className="md:col-span-2 bg-white/90 backdrop-blur-sm border border-green-100 rounded-2xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col gap-6 transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
                <div>
                  <div className="text-[10px] text-emerald-800 font-extrabold uppercase bg-emerald-50 border border-emerald-250 px-2 py-0.5 rounded inline-block">
                    Active Pitch Profile
                  </div>
                  <h3 className="text-xl font-bold text-zinc-900 mt-1">{selectedVenue.name}</h3>
                  <p className="text-xs text-zinc-500 flex items-center gap-1 mt-0.5 font-bold">
                    <MapPin className="w-3 h-3 text-emerald-600" /> Located in {selectedVenue.city}
                  </p>
                </div>

                <p className="text-xs text-zinc-650 leading-relaxed bg-zinc-50 p-3.5 rounded-xl border border-zinc-200 shadow-inner">
                  {selectedVenue.description}
                </p>

                {/* Score stats */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                  <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-200 shadow-inner">
                    <div className="text-[10px] text-zinc-500 uppercase font-bold">Avg Score T20</div>
                    <div className="text-2xl font-black text-emerald-650 mt-1">{selectedVenue.avgFirstInningsT20}</div>
                    <span className="text-[9px] text-zinc-500 font-medium">runs (1st Innings)</span>
                  </div>

                  <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-200 shadow-inner">
                    <div className="text-[10px] text-zinc-500 uppercase font-bold">Avg Score ODI</div>
                    <div className="text-2xl font-black text-emerald-650 mt-1">{selectedVenue.avgFirstInningsODI}</div>
                    <span className="text-[9px] text-zinc-500 font-medium">runs (1st Innings)</span>
                  </div>

                  <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-200 shadow-inner">
                    <div className="text-[10px] text-zinc-500 uppercase font-bold">Pitch Type</div>
                    <div className="text-lg font-black text-zinc-800 mt-1">{selectedVenue.pitchType}</div>
                    <span className="text-[9px] text-zinc-500 font-medium">ground characteristic</span>
                  </div>
                </div>

                {/* Pitch analysis meters */}
                <div className="flex flex-col gap-4">
                  <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Pitch Assistance Ratings</h4>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Spin assist */}
                    <div className="flex flex-col gap-1.5">
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-zinc-500">Spin Bowler Assistance</span>
                        <span className="text-emerald-700">{selectedVenue.spinAssist}/5</span>
                      </div>
                      <div className="w-full bg-zinc-100 h-2.5 rounded-full overflow-hidden border border-zinc-200 shadow-inner">
                        <div
                          className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                          style={{ width: `${(selectedVenue.spinAssist / 5) * 100}%` }}
                        />
                      </div>
                    </div>

                    {/* Pace assist */}
                    <div className="flex flex-col gap-1.5">
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-zinc-500">Pace/Bounce Assistance</span>
                        <span className="text-emerald-700">{selectedVenue.paceAssist}/5</span>
                      </div>
                      <div className="w-full bg-zinc-100 h-2.5 rounded-full overflow-hidden border border-zinc-200 shadow-inner">
                        <div
                          className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                          style={{ width: `${(selectedVenue.paceAssist / 5) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

              </div>

            </div>
          </div>
        )}

        {/* =======================================================
            TAB 4: DEEP DIVE ANALYTICAL CHART
            ======================================================= */}
        {activeTab === 'analytics' && (
          <div className="flex flex-col gap-6">
            <div className="bg-white/90 backdrop-blur-sm border border-green-100 rounded-2xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
              <h2 className="text-lg font-bold text-zinc-800 flex items-center gap-1.5">
                <TrendingUp className="w-5 h-5 text-emerald-650" /> Deep Dive Wicket & Run Rate Analytics
              </h2>
              <p className="text-xs text-zinc-555 mt-1">Study how wicket loss impacts the mathematical projected score across different overs.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Over by Wicket grid */}
              <div className="bg-white/90 backdrop-blur-sm border border-green-100 rounded-2xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col gap-4 transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
                <h3 className="text-xs font-extrabold text-zinc-550 uppercase tracking-wider">1st Innings Projected Score Decay Matrix (T20)</h3>
                <p className="text-xs text-zinc-550 leading-relaxed font-medium">
                  Below is a mathematical decay matrix showing how wickets lost (columns) vs overs bowled (rows) changes the projected score from a base score of 120/0 after 10 overs.
                </p>

                <div className="overflow-x-auto rounded-lg border border-zinc-200 shadow-inner">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-zinc-100 text-zinc-600 font-bold uppercase border-b border-zinc-200">
                        <th className="p-3">Overs Bowled</th>
                        <th className="p-3 text-center">0 Wkts</th>
                        <th className="p-3 text-center">2 Wkts</th>
                        <th className="p-3 text-center">5 Wkts</th>
                        <th className="p-3 text-center">8 Wkts</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200 bg-white">
                      {[
                        { over: 5, scores: [195, 182, 155, 120] },
                        { over: 10, scores: [205, 192, 158, 118] },
                        { over: 15, scores: [215, 202, 162, 110] },
                        { over: 18, scores: [225, 208, 165, 98] }
                      ].map((row, idx) => (
                        <tr key={idx} className="hover:bg-zinc-50">
                          <td className="p-3 font-bold text-zinc-800">Over {row.over}</td>
                          {row.scores.map((sc, sIdx) => (
                            <td key={sIdx} className="p-3 text-center font-bold text-zinc-650">{sc} runs</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Win probability analysis */}
              <div className="bg-white/90 backdrop-blur-sm border border-green-100 rounded-2xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col gap-4 transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
                <h3 className="text-xs font-extrabold text-zinc-550 uppercase tracking-wider">Win Probability Logistic Curve (T20 Chase)</h3>
                
                <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-200 flex flex-col gap-3 text-xs leading-relaxed text-zinc-650 shadow-inner">
                  <div className="flex gap-2.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0 mt-1.5 animate-pulse" />
                    <p>
                      <strong>0-2 wickets down:</strong> Team has maximum flexibility. Win probability decays slowly even if RRR rises up to 10.5.
                    </p>
                  </div>
                  <div className="flex gap-2.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0 mt-1.5" />
                    <p>
                      <strong>3-5 wickets down:</strong> Run rate pressure begins to compound. Wicket risk factor limits aggressive sweeps, leading to a steeper probability curve.
                    </p>
                  </div>
                  <div className="flex gap-2.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-650 shrink-0 mt-1.5" />
                    <p>
                      <strong>6+ wickets down:</strong> Tailenders are exposed. Required Run Rate spikes generate exponential win probability decay. With 9 wickets down, even a 6 RRR has less than 20% win chance due to imminent wrap-up risk.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-2 p-3 bg-emerald-50 border border-emerald-150 rounded-xl text-xs text-emerald-800">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-emerald-700" />
                  <p className="font-semibold">Our Monte Carlo engine uses these decaying distributions automatically during the live simulation.</p>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* =======================================================
            TAB 5: HELP & METHODOLOGY
            ======================================================= */}
        {activeTab === 'help' && (
          <div className="bg-white/90 backdrop-blur-sm border border-green-100 rounded-2xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col gap-6 max-w-3xl mx-auto transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
            <div>
              <h2 className="text-xl font-bold text-zinc-800 flex items-center gap-2">
                <Info className="w-5 h-5 text-emerald-650" /> Methodology & Mathematical Formulas
              </h2>
              <p className="text-xs text-zinc-550 mt-1">Understanding the cricket predictive algorithms and Monte Carlo models.</p>
            </div>

            <div className="flex flex-col gap-6 text-xs text-zinc-650 leading-relaxed font-medium">
              
              <div className="flex flex-col gap-2">
                <h4 className="font-extrabold text-sm text-zinc-800">1. Monte Carlo Random-Walk Simulation</h4>
                <p>
                  Instead of standard linear regression which fails to adapt to specific live matchups, our engine runs a <strong>150-iteration random walk simulation</strong> for the remaining balls of the match on every single ball.
                </p>
                <p>
                  The probability of each ball outcome (dot, single, double, boundary, or wicket) is computed dynamically depending on:
                </p>
                <ul className="list-disc pl-5 flex flex-col gap-1 mt-1 text-zinc-500">
                  <li>Current Match Stage (Powerplay acceleration vs. Middle consolidation vs. Death-overs strike)</li>
                  <li>Wickets remaining (tailenders lose wickets faster and score at lower strike rates)</li>
                  <li>Batter and Bowler strengths (based on team strength data)</li>
                  <li>Venue conditions (e.g., small boundaries increase boundary probability)</li>
                </ul>
              </div>

              <hr className="border-zinc-250" />

              <div className="flex flex-col gap-2">
                <h4 className="font-extrabold text-sm text-zinc-800">2. First Innings Projections</h4>
                <p>
                  The projected score represents the average final score of all 150 simulation iterations. The 10th and 90th percentiles are selected to generate the confidence interval range (±15 to ±30 runs depending on the stage).
                </p>
              </div>

              <hr className="border-zinc-250" />

              <div className="flex flex-col gap-2">
                <h4 className="font-extrabold text-sm text-zinc-800">3. Second Innings Win Probability</h4>
                <p>
                  For the chasing innings, the simulator calculates the percentage of random-walk simulations where the batting team successfully reaches the target before getting bowled out (10 wickets down) or running out of balls.
                </p>
                <p>
                  This provides a highly realistic Win Probability curve similar to professional models used in international broadcasts.
                </p>
              </div>

            </div>
          </div>
        )}

      </div>

      {/* FOOTER */}
      <footer className="w-full bg-white border-t border-zinc-200 py-4 px-6 text-center text-zinc-400 text-xs font-bold">
        <p>Cricket Predictor AI © 2026 | Built for Realistic, Natural Sports Analytics</p>
      </footer>
    </main>
  );
}
