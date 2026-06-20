'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { TEAMS, VENUES, SQUADS } from '@/lib/constants';
import { predictMatch } from '@/lib/predictor-engine';
import { MatchState, PredictionResult } from '@/lib/types';
import { WinProbabilityGauge, TrendLineChart, ScoreDistributionChart } from '@/components/CustomCharts';
import { Button } from '@/components/ui/button';
import {
  Play, Pause, ChevronRight, RotateCcw, Cpu,
  TrendingUp, MapPin, Sparkles, Info, Volume2, AlertTriangle, ArrowLeft
} from 'lucide-react';

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

function SimulatorContent() {
  const searchParams = useSearchParams();
  const matchId = searchParams.get('match') || 'ind-pak';

  const [simMatchState, setSimMatchState] = useState<MatchState>(() => {
    const found = PRESET_MATCHES.find(m => m.id === matchId) || PRESET_MATCHES[0];
    return JSON.parse(JSON.stringify(found));
  });

  const [simPrediction, setSimPrediction] = useState<PredictionResult | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [simulationSpeed, setSimulationSpeed] = useState(2000); // ms per ball
  const [commentary, setCommentary] = useState<string[]>([]);
  const [audioEnabled, setAudioEnabled] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const commentaryEndRef = useRef<HTMLDivElement | null>(null);

  // Initialize prediction on load
  useEffect(() => {
    const pred = predictMatch(simMatchState);
    setSimPrediction(pred);
    setCommentary([
      `🔴 MATCH CENTRE ACTIVE: ${simMatchState.battingTeam.name} vs ${simMatchState.bowlingTeam.name} at ${simMatchState.venue.name}.`,
      'Match initialized. Press Play to start the ball-by-ball live simulation.'
    ]);
  }, [matchId]);

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
    const initialSim = PRESET_MATCHES.find(m => m.id === matchId);
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
      {/* Background decoration elements */}
      <div className="fixed top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-emerald-400/20 rounded-full blur-[100px] pointer-events-none animate-pulse" style={{ animationDuration: '4s' }} />
      <div className="fixed bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] bg-green-500/15 rounded-full blur-[100px] pointer-events-none animate-pulse" style={{ animationDuration: '6s' }} />

      {/* HEADER SECTION */}
      <header className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-lg border-b border-green-200 py-3.5 px-6 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-4">
          <a
            href="/"
            className="flex items-center justify-center w-8 h-8 rounded-full border border-green-200 bg-white hover:bg-green-50 text-green-700 transition-all shadow-sm"
            title="Back to Home Dashboard"
          >
            <ArrowLeft className="w-4 h-4" />
          </a>
          <div>
            <h1 className="font-black text-lg tracking-tight bg-gradient-to-r from-emerald-800 via-teal-700 to-emerald-800 bg-clip-text text-transparent flex items-center gap-2">
              🏟️ LIVE MATCH CENTRE
            </h1>
            <p className="text-[10px] text-emerald-700 font-extrabold uppercase tracking-widest">
              Real-time Simulation Arena
            </p>
          </div>
        </div>

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
            <Volume2 className="w-4 h-4 text-emerald-600" />
          </button>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-50 text-red-800 border border-red-200 text-[10px] font-bold uppercase rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-red-650 animate-ping" /> Match Simulation Live
          </span>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <div className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-6 overflow-y-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* LEFT COLUMN: SIMULATION CONTROL & LIVE STATE */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            
            {/* SCOREBOARD CARD */}
            <div className="bg-white/90 backdrop-blur-sm border border-green-100 rounded-2xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col gap-4 transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
              <div className="flex justify-between items-center flex-wrap gap-3">
                <div>
                  <span className="text-[10px] text-emerald-800 font-extrabold tracking-wider uppercase bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                    Active Venue: {simMatchState.venue.name}
                  </span>
                  <h3 className="text-sm font-bold text-zinc-650 mt-1">Live Scoreboard Tracker</h3>
                </div>
              </div>

              <hr className="border-zinc-200/60" />

              {/* Scoreboard display */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                
                {/* Score, Wickets, Overs */}
                <div className="flex items-center gap-4 bg-gradient-to-br from-green-700 via-emerald-600 to-teal-800 text-white p-5 rounded-2xl shadow-lg relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl transform translate-x-10 -translate-y-10 group-hover:translate-x-5 transition-transform duration-700" />
                  <div className="flex-1 relative z-10">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full border border-white/50" style={{ backgroundColor: simMatchState.battingTeam.color }} />
                      <h2 className="text-xl font-black tracking-tight">{simMatchState.battingTeam.code}</h2>
                      <span className="text-xs font-semibold text-emerald-200">vs</span>
                      <span className="text-xs font-bold text-emerald-100">{simMatchState.bowlingTeam.code}</span>
                    </div>
                    <div className="text-4xl font-extrabold tracking-tighter mt-1">
                      {simMatchState.score}
                      <span className="text-2xl font-bold text-emerald-200">/{simMatchState.wickets}</span>
                    </div>
                  </div>
                  
                  <div className="text-right relative z-10">
                    <div className="text-[10px] font-extrabold text-emerald-250 uppercase tracking-widest">Overs Bowled</div>
                    <div className="text-2xl font-black tracking-tight mt-0.5 text-white">
                      {simMatchState.overs}
                      <span className="text-sm font-bold text-emerald-200">.{simMatchState.balls}</span>
                      <span className="text-xs font-normal text-emerald-300">/{simMatchState.format === 'T20' ? '20' : '50'}</span>
                    </div>
                    <div className="text-[10px] text-emerald-100 font-bold mt-1">
                      CRR: {((simMatchState.score / Math.max(1, (simMatchState.overs * 6 + simMatchState.balls))) * 6).toFixed(2)}
                    </div>
                  </div>
                </div>

                {/* Chasing Target Status (if chasing) */}
                {simMatchState.innings === '2nd' && simMatchState.target ? (
                  <div className="bg-emerald-50/50 border border-emerald-200 p-4 rounded-xl flex flex-col justify-center shadow-inner">
                    <div className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Chasing Target</div>
                    <div className="text-2xl font-black tracking-tight mt-0.5 text-zinc-900">
                      {simMatchState.target}
                      <span className="text-xs text-zinc-650 font-bold ml-2">
                        Need {simMatchState.target - simMatchState.score} runs in {Math.max(0, (simMatchState.format === 'T20' ? 120 : 300) - (simMatchState.overs * 6 + simMatchState.balls))} balls
                      </span>
                    </div>
                    <div className="text-[10px] text-zinc-500 font-bold mt-1 uppercase">
                      Required RR: {(((simMatchState.target - simMatchState.score) / Math.max(1, (simMatchState.format === 'T20' ? 120 : 300) - (simMatchState.overs * 6 + simMatchState.balls))) * 6).toFixed(2)} RPO
                    </div>
                  </div>
                ) : (
                  <div className="bg-zinc-50/80 border border-zinc-200 p-4 rounded-xl flex flex-col justify-center shadow-inner">
                    <div className="text-[10px] font-extrabold text-zinc-500 uppercase tracking-wider">Venue & Pitch</div>
                    <div className="text-sm font-extrabold text-zinc-800 mt-1 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-emerald-750" />
                      {simMatchState.venue.name}
                    </div>
                    <div className="text-[10px] text-zinc-650 mt-1 font-bold">
                      Pitch: {simMatchState.pitchType} | Avg First Innings: {simMatchState.format === 'T20' ? simMatchState.venue.avgFirstInningsT20 : simMatchState.venue.avgFirstInningsODI}
                    </div>
                  </div>
                )}
              </div>

              {/* Over Ball-by-ball Timeline */}
              <div className="bg-zinc-50 border border-zinc-200 p-3.5 rounded-xl flex items-center justify-between gap-4">
                <div className="text-[10px] font-extrabold text-zinc-500 uppercase tracking-wider">
                  Current Over:
                </div>
                
                <div className="flex items-center gap-2 overflow-x-auto py-1">
                  {simMatchState.currentOverHistory.length === 0 ? (
                    <span className="text-xs text-zinc-400 italic font-medium">Waiting for bowler...</span>
                  ) : (
                    simMatchState.currentOverHistory.map((ball, i) => {
                      let colorClass = 'bg-white text-zinc-700 border-zinc-300';
                      if (ball === 'W') colorClass = 'bg-red-650 text-white border-red-700 font-black';
                      else if (ball === '4' || ball === '6') colorClass = 'bg-emerald-650 text-white border-emerald-700 font-bold';
                      return (
                        <span
                          key={i}
                          className={`w-7 h-7 flex items-center justify-center rounded-full border text-xs font-bold shrink-0 ${colorClass}`}
                        >
                          {ball}
                        </span>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Simulator Playback Controls */}
              <div className="flex items-center justify-between flex-wrap gap-4 mt-2">
                <div className="flex items-center gap-3">
                  <Button
                    onClick={() => setIsPlaying(!isPlaying)}
                    variant={isPlaying ? 'outline' : 'default'}
                    size="sm"
                    className={`gap-1.5 font-bold text-xs rounded-full transition-all duration-300 transform hover:scale-105 active:scale-95 ${
                      isPlaying 
                        ? 'border-amber-500 text-amber-700 hover:bg-amber-50 shadow-[0_0_15px_rgba(245,158,11,0.3)] animate-pulse' 
                        : 'bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white shadow-[0_4px_14px_0_rgba(220,38,38,0.39)] hover:shadow-[0_6px_20px_rgba(220,38,38,0.23)] border-none'
                    }`}
                  >
                    {isPlaying ? (
                      <>
                        <Pause className="w-4 h-4 fill-current" /> Pause
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 fill-current" /> Play Live
                      </>
                    )}
                  </Button>

                  <Button
                    onClick={simulateNextBall}
                    disabled={isPlaying}
                    variant="outline"
                    size="sm"
                    className="gap-1 font-bold text-xs rounded-full border-green-600 text-green-700 hover:bg-green-600 hover:text-white transition-all duration-300 transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:transform-none"
                  >
                    Next Ball <ChevronRight className="w-4 h-4" />
                  </Button>

                  <Button
                    onClick={resetSimulator}
                    variant="ghost"
                    size="sm"
                    className="gap-1 font-bold text-xs text-zinc-500 hover:text-zinc-900 rounded-full hover:bg-zinc-100 transition-all duration-300"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Reset
                  </Button>
                </div>

                {/* Playback speed selector */}
                <div className="flex items-center gap-2 bg-green-50 border border-green-200 p-1 px-2.5 rounded-full text-xs shadow-inner">
                  <span className="text-green-800 font-bold text-[10px] uppercase ml-1">Speed:</span>
                  <button
                    onClick={() => setSimulationSpeed(2500)}
                    className={`px-2 py-0.5 rounded-full font-bold text-[10px] transition-all ${simulationSpeed === 2500 ? 'bg-green-600 text-white shadow-md transform scale-105' : 'text-green-700 hover:bg-green-100'}`}
                  >
                    1x
                  </button>
                  <button
                    onClick={() => setSimulationSpeed(1200)}
                    className={`px-2 py-0.5 rounded-full font-bold text-[10px] transition-all ${simulationSpeed === 1200 ? 'bg-green-600 text-white shadow-md transform scale-105' : 'text-green-700 hover:bg-green-100'}`}
                  >
                    2x
                  </button>
                  <button
                    onClick={() => setSimulationSpeed(400)}
                    className={`px-2 py-0.5 rounded-full font-bold text-[10px] transition-all ${simulationSpeed === 400 ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md transform scale-105' : 'text-green-700 hover:bg-green-100'}`}
                  >
                    Turbo
                  </button>
                </div>
              </div>
            </div>

            {/* BATTER & BOWLER CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Batting Card */}
              <div className="bg-white/90 backdrop-blur-sm border border-green-100 rounded-2xl p-4 flex flex-col gap-3 shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
                <h4 className="text-xs font-extrabold text-zinc-550 uppercase tracking-wider">Current Batter Partnership</h4>
                
                <div className="flex flex-col gap-2.5">
                  {/* Striker */}
                  <div className="flex justify-between items-center bg-emerald-50/30 p-2.5 rounded-lg border-l-2 border-emerald-600 border-r border-t border-b border-zinc-200">
                    <div>
                      <div className="text-xs font-black flex items-center gap-1.5 text-zinc-800">
                        {simMatchState.striker.name}
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" title="Striking" />
                      </div>
                      <div className="text-[10px] text-zinc-555 font-bold mt-0.5">S/R: {simMatchState.striker.balls > 0 ? ((simMatchState.striker.runs / simMatchState.striker.balls) * 100).toFixed(1) : '0.0'}</div>
                    </div>
                    <div className="text-sm font-black text-zinc-850">
                      {simMatchState.striker.runs}
                      <span className="text-[10px] font-bold text-zinc-500"> ({simMatchState.striker.balls})</span>
                    </div>
                  </div>

                  {/* Non-Striker */}
                  <div className="flex justify-between items-center bg-white p-2.5 rounded-lg border border-zinc-200">
                    <div>
                      <div className="text-xs font-bold text-zinc-700">
                        {simMatchState.nonStriker.name}
                      </div>
                      <div className="text-[10px] text-zinc-500 font-bold mt-0.5">S/R: {simMatchState.nonStriker.balls > 0 ? ((simMatchState.nonStriker.runs / simMatchState.nonStriker.balls) * 100).toFixed(1) : '0.0'}</div>
                    </div>
                    <div className="text-xs font-bold text-zinc-700">
                      {simMatchState.nonStriker.runs}
                      <span className="text-[10px] font-bold text-zinc-500"> ({simMatchState.nonStriker.balls})</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bowling Card */}
              <div className="bg-white/90 backdrop-blur-sm border border-green-100 rounded-2xl p-4 flex flex-col gap-3 shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
                <h4 className="text-xs font-extrabold text-zinc-555 uppercase tracking-wider">Active Bowler</h4>
                
                <div className="flex justify-between items-center bg-emerald-50/10 p-2.5 rounded-lg border border-zinc-205">
                  <div>
                    <div className="text-xs font-black text-zinc-800">
                      {simMatchState.bowler.name}
                    </div>
                    <div className="text-[10px] text-zinc-555 font-bold mt-0.5">
                      Econ: {((simMatchState.score / Math.max(1, simMatchState.overs * 6 + simMatchState.balls)) * 6).toFixed(2)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-black text-zinc-800">
                      {simMatchState.bowler.wickets} <span className="text-[10px] font-bold text-zinc-500">wkts</span>
                    </div>
                    <div className="text-[10px] text-zinc-555 font-bold mt-0.5">
                      {simMatchState.overs}.{simMatchState.balls} overs
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* LIVE PROJECTION GRAPH */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {simMatchState.innings === '2nd' && simMatchState.target ? (
                <TrendLineChart
                  data={simMatchState.history.map(h => ({ over: h.over, value: h.winProb ?? 50 }))}
                  yLabel={`${simMatchState.battingTeam.code} Win Probability %`}
                  yMin={0}
                  yMax={100}
                  color={simMatchState.battingTeam.color || '#10b981'}
                />
              ) : (
                <TrendLineChart
                  data={simMatchState.history.map(h => ({ over: h.over, value: h.projectedScore ?? 160 }))}
                  yLabel="Projected Final Score"
                  yMin={Math.max(50, (simPrediction?.projectedScore ?? 180) - 60)}
                  yMax={(simPrediction?.projectedScore ?? 180) + 60}
                  color="#10b981"
                />
              )}

              {/* MONTE CARLO BELL CURVE */}
              {simMatchState.innings === '1st' && simPrediction ? (
                <ScoreDistributionChart
                  projectedScore={simPrediction.projectedScore}
                  range={simPrediction.projectedRange}
                  color="#10b981"
                />
              ) : (
                <div className="bg-white border border-zinc-200/80 rounded-xl p-4 flex flex-col justify-center shadow-sm">
                  <h4 className="text-xs font-extrabold text-zinc-555 uppercase tracking-wider mb-2">Chasing Analytics</h4>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="bg-zinc-50 p-2.5 rounded-lg border border-zinc-200">
                      <span className="text-[10px] text-zinc-500 uppercase font-bold">Runs Required</span>
                      <div className="text-lg font-black mt-0.5 text-zinc-800">{simMatchState.target ? simMatchState.target - simMatchState.score : 0} runs</div>
                    </div>
                    <div className="bg-zinc-50 p-2.5 rounded-lg border border-zinc-200">
                      <span className="text-[10px] text-zinc-500 uppercase font-bold">Balls Left</span>
                      <div className="text-lg font-black mt-0.5 text-zinc-800">
                        {Math.max(0, (simMatchState.format === 'T20' ? 120 : 300) - (simMatchState.overs * 6 + simMatchState.balls))}
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 text-[11px] text-zinc-650 bg-zinc-50 p-2.5 rounded-lg border border-zinc-200 italic font-medium">
                    Monte Carlo simulations are evaluating batters' wicket risks versus boundary capabilities.
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: AI ANALYTICAL DASHBOARD */}
          <div className="flex flex-col gap-6">
            
            {/* WIN PROBABILITY GAUGE */}
            {simPrediction && (
              <WinProbabilityGauge
                value={simPrediction.winProbability}
                batTeamCode={simMatchState.battingTeam.code}
                bowTeamCode={simMatchState.bowlingTeam.code}
                batColor={simMatchState.battingTeam.color}
                bowColor={simMatchState.bowlingTeam.color}
              />
            )}

            {/* AI PREDICTION OUTPUT */}
            <div className="bg-white/90 backdrop-blur-sm border border-green-100 rounded-2xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col gap-4 transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
              <h3 className="text-xs font-extrabold text-zinc-700 uppercase tracking-wider flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-emerald-650" /> AI Prediction Output
              </h3>

              {simPrediction ? (
                <div className="flex flex-col gap-4">
                  {/* Projection Card */}
                  <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100 shadow-inner">
                    {simMatchState.innings === '1st' ? (
                      <>
                        <div className="text-xs text-emerald-800 font-bold uppercase">Projected Score</div>
                        <div className="text-4xl font-black tracking-tight mt-1 text-emerald-700">
                          {simPrediction.projectedScore}
                        </div>
                        <div className="text-[10px] text-emerald-900 font-bold mt-1">
                          Likely range: {simPrediction.projectedRange[0]} - {simPrediction.projectedRange[1]} runs
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="text-xs text-emerald-800 font-bold uppercase">Win Probability</div>
                        <div className="text-4xl font-black tracking-tight mt-1 text-emerald-700">
                          {simPrediction.winProbability}%
                        </div>
                        <div className="text-[10px] text-emerald-900 font-bold mt-1">
                          {simMatchState.battingTeam.name} Win Likelihood
                        </div>
                      </>
                    )}
                  </div>

                  {/* Insight Badges */}
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="bg-zinc-50 p-3 rounded-lg border border-zinc-200 flex flex-col shadow-inner">
                      <span className="text-[10px] text-zinc-500 uppercase font-bold">Risk Level</span>
                      <span className={`text-sm font-black mt-1 uppercase ${
                        simPrediction.riskLevel === 'Low' ? 'text-emerald-700' :
                        simPrediction.riskLevel === 'Medium' ? 'text-amber-600' : 'text-red-650'
                      }`}>
                        {simPrediction.riskLevel}
                      </span>
                    </div>

                    <div className="bg-zinc-50 p-3 rounded-lg border border-zinc-200 flex flex-col shadow-inner">
                      <span className="text-[10px] text-zinc-500 uppercase font-bold">Pace Assist</span>
                      <span className="text-sm font-black mt-1 text-zinc-700">
                        {simMatchState.venue.paceAssist}/5 (High)
                      </span>
                    </div>
                  </div>

                  {/* AI Strategic Commentary */}
                  <div className="flex flex-col gap-2">
                    <div className="text-[10px] font-extrabold text-zinc-500 uppercase tracking-wider">AI Strategic Insights</div>
                    <div className="flex flex-col gap-2">
                      {simPrediction.keyInsights.map((insight, idx) => (
                        <div key={idx} className="flex gap-2 text-xs bg-zinc-50 p-2.5 rounded-lg border border-zinc-200 text-zinc-700">
                          <Sparkles className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                          <p className="font-medium">{insight}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-xs text-zinc-400 text-center py-6">
                  Running prediction calculations...
                </div>
              )}
            </div>

            {/* LIVE COMMENTARY / LOG FEED */}
            <div className="bg-white/90 backdrop-blur-sm border border-green-100 rounded-2xl p-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col h-64 transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
              <h3 className="text-xs font-extrabold text-zinc-750 uppercase tracking-wider mb-2 flex items-center justify-between">
                <span>📻 Live Text Commentary</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-ping" />
              </h3>
              
              <div className="flex-1 bg-zinc-50 rounded-lg p-3 border border-zinc-200 overflow-y-auto font-mono text-[11px] text-zinc-700 flex flex-col gap-2 shadow-inner">
                {commentary.map((line, idx) => (
                  <div key={idx} className="border-b border-zinc-200/60 pb-1.5 leading-relaxed font-semibold">
                    {line}
                  </div>
                ))}
                <div ref={commentaryEndRef} />
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* FOOTER */}
      <footer className="w-full bg-white border-t border-zinc-200 py-4 px-6 text-center text-zinc-400 text-xs font-bold mt-auto">
        <p>Cricket Predictor AI © 2026 | Built for Realistic, Natural Sports Analytics</p>
      </footer>
    </main>
  );
}

export default function LivePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-green-50/50 flex flex-col items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <h2 className="text-lg font-bold text-emerald-800">Initializing Live Match Center...</h2>
          <p className="text-xs text-zinc-500 mt-1">Preparing Monte Carlo Simulation engine</p>
        </div>
      </div>
    }>
      <SimulatorContent />
    </Suspense>
  );
}
