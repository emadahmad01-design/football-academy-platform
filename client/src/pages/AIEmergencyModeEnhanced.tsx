import { useState, useRef, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Cpu, 
  Sparkles, 
  Activity,
  Brain,
  Target,
  TrendingUp
} from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';

interface Player {
  id: number;
  x: number; // percentage
  y: number; // percentage
  color: string;
  role: string;
  isDragging?: boolean;
}

interface TacticalPlan {
  tactic: string;
  successRate: number;
  description: string;
  formationChange: string;
  weaknessDetected: string;
  keyInstructions: string[];
  timing: string;
}

const FORMATIONS = ['3-3-2', '2-3-3', '3-2-3', '2-4-2', '4-2-2', '3-4-1'];

export default function AIEmergencyModeEnhanced() {
  const { language } = useLanguage();
  const [matchMinute, setMatchMinute] = useState('70');
  const [currentScore, setCurrentScore] = useState('0-1');
  const [playerCount, setPlayerCount] = useState('9');
  const [currentFormation, setCurrentFormation] = useState('3-3-2');
  const [opponentFormation, setOpponentFormation] = useState('4-4-1');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [tacticalPlan, setTacticalPlan] = useState<TacticalPlan | null>(null);
  const [aiText, setAiText] = useState('بانتظار تحليل التمركز...');
  const [isTyping, setIsTyping] = useState(false);
  
  const [players, setPlayers] = useState<Player[]>([
    { id: 1, x: 50, y: 5, color: 'bg-yellow-500', role: 'GK' },  // Your GK at bottom
    { id: 3, x: 30, y: 15, color: 'bg-blue-500', role: 'DF' },   // Defenders
    { id: 4, x: 70, y: 15, color: 'bg-blue-500', role: 'DF' },
    { id: 6, x: 50, y: 28, color: 'bg-blue-400', role: 'CM' },   // Midfielders
    { id: 7, x: 25, y: 38, color: 'bg-blue-400', role: 'LW' },   // Forwards
    { id: 11, x: 75, y: 38, color: 'bg-blue-400', role: 'RW' },
    { id: 9, x: 50, y: 45, color: 'bg-orange-600', role: 'ST' }  // Striker at top of your half
  ]);

  const [draggedPlayer, setDraggedPlayer] = useState<number | null>(null);
  const [ballPosition, setBallPosition] = useState<{ x: number; y: number } | null>(null);
  const [opponentPlayers, setOpponentPlayers] = useState<Player[]>([]);
  const pitchRef = useRef<HTMLDivElement>(null);

  const generatePlan = trpc.tactical.generateEmergencyPlan.useMutation();

  // Generate your team players based on formation
  const getYourTeamPlayers = (formation: string): Player[] => {
    const [def, mid, fwd] = formation.split('-').map(Number);
    const teamPlayers: Player[] = [];
    let id = 1;

    // Goalkeeper - at bottom of pitch
    teamPlayers.push({ id: id++, x: 50, y: 5, color: 'bg-yellow-500', role: 'GK' });

    // Defenders - in bottom third
    const defSpacing = 60 / (def + 1);
    for (let i = 0; i < def; i++) {
      teamPlayers.push({ id: id++, x: 20 + defSpacing * (i + 1), y: 15, color: 'bg-blue-500', role: 'DF' });
    }

    // Midfielders - in middle of bottom half
    const midSpacing = 60 / (mid + 1);
    for (let i = 0; i < mid; i++) {
      teamPlayers.push({ id: id++, x: 20 + midSpacing * (i + 1), y: 28, color: 'bg-blue-400', role: 'MF' });
    }

    // Forwards - attacking (closer to halfway line)
    const fwdSpacing = 60 / (fwd + 1);
    for (let i = 0; i < fwd; i++) {
      teamPlayers.push({ id: id++, x: 20 + fwdSpacing * (i + 1), y: 42, color: 'bg-orange-500', role: 'FW' });
    }

    return teamPlayers;
  };

  // Generate opponent players based on formation
  const getOpponentPlayers = (formation: string): Player[] => {
    const [def, mid, fwd] = formation.split('-').map(Number);
    const opponents: Player[] = [];
    let id = 100; // Start opponent IDs at 100

    // Goalkeeper - at top of pitch
    opponents.push({ id: id++, x: 50, y: 95, color: 'bg-red-600', role: 'GK' });

    // Defenders - in top third
    const defSpacing = 60 / (def + 1);
    for (let i = 0; i < def; i++) {
      opponents.push({ id: id++, x: 20 + defSpacing * (i + 1), y: 85, color: 'bg-red-500', role: 'DF' });
    }

    // Midfielders - in middle of top half
    const midSpacing = 60 / (mid + 1);
    for (let i = 0; i < mid; i++) {
      opponents.push({ id: id++, x: 20 + midSpacing * (i + 1), y: 70, color: 'bg-red-400', role: 'MF' });
    }

    // Forwards - attacking (closer to halfway line)
    const fwdSpacing = 60 / (fwd + 1);
    for (let i = 0; i < fwd; i++) {
      opponents.push({ id: id++, x: 20 + fwdSpacing * (i + 1), y: 55, color: 'bg-red-300', role: 'FW' });
    }

    return opponents;
  };

  // Update your team players when formation changes
  useEffect(() => {
    setPlayers(getYourTeamPlayers(currentFormation));
  }, [currentFormation]);

  // Update opponent players when formation changes
  useEffect(() => {
    setOpponentPlayers(getOpponentPlayers(opponentFormation));
  }, [opponentFormation]);

  const handleMouseDown = (playerId: number) => {
    setDraggedPlayer(playerId);
    setPlayers(prev => prev.map(p => 
      p.id === playerId ? { ...p, isDragging: true } : p
    ));
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (draggedPlayer === null || !pitchRef.current) return;

    const rect = pitchRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    setPlayers(prev => prev.map(p =>
      p.id === draggedPlayer ? { ...p, x: Math.max(5, Math.min(95, x)), y: Math.max(5, Math.min(95, y)) } : p
    ));
  };

  const handleMouseUp = () => {
    if (draggedPlayer !== null) {
      setPlayers(prev => prev.map(p => ({ ...p, isDragging: false })));
      setDraggedPlayer(null);
      setAiText('التمركز تغير... اضغط "تحليل" لتحديث الخطة.');
      setIsTyping(false);
    }
  };

  const handlePitchClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Don't place ball if dragging a player
    if (draggedPlayer !== null) return;
    
    if (!pitchRef.current) return;
    const rect = pitchRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    setBallPosition({ x, y });
    setAiText('تم وضع الكرة. اضغط "تحليل" لاكتشاف الثغرات بناءً على موقع الكرة.');
    setIsTyping(false);
  };

  const typeText = async (text: string) => {
    setIsTyping(true);
    setAiText('');
    
    for (let i = 0; i < text.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 20));
      setAiText(prev => prev + text[i]);
    }
    
    setIsTyping(false);
  };

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setAiText('جاري تحليل الثغرات...');
    setIsTyping(true);

    try {
      const result = await generatePlan.mutateAsync({
        matchMinute: parseInt(matchMinute),
        currentScore,
        playerCount: parseInt(playerCount),
        currentFormation,
        opponentFormation,
        ballPosition: ballPosition || undefined
      });

      setTacticalPlan(result);
      
      const report = `
        <div class="space-y-4">
          <div class="text-blue-400 font-bold border-b border-blue-900 pb-2">تم رصد ثغرة في دفاع الخصم!</div>
          <p class="text-slate-200">بما أن الوقت هو <span class="text-orange-400">${matchMinute}'</span> والنتيجة <span class="text-red-400">${currentScore}</span>، يوصي المحرك بـ <strong>${result.tactic}</strong>.</p>
          <div class="bg-slate-900 p-3 rounded border-l-4 border-green-500">
            <strong>الثغرة المكتشفة:</strong> ${result.weaknessDetected}
          </div>
          <div class="bg-slate-900 p-3 rounded border-l-4 border-blue-500">
            <strong>التعليمات الرئيسية:</strong>
            <ul class="list-disc list-inside mt-2 space-y-1">
              ${result.keyInstructions.map(inst => `<li>${inst}</li>`).join('')}
            </ul>
          </div>
          <p class="text-[10px] text-slate-500 uppercase">Success Rate: <span class="text-green-400 font-bold">${result.successRate}%</span></p>
          <p class="text-xs text-slate-400">${result.timing}</p>
        </div>
      `;
      
      await typeText(report);
      toast.success('تم التحليل بنجاح!');
    } catch (error) {
      toast.error('فشل التحليل');
      setAiText('حدث خطأ في التحليل. يرجى المحاولة مرة أخرى.');
      setIsTyping(false);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 flex flex-col">
      {/* Header */}
      <header className="h-16 border-b border-slate-800 bg-[#0f172a] flex items-center justify-between px-8">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-1.5 rounded-lg">
            <Cpu className="w-5 h-5 text-white" />
          </div>
          <h1 className="font-black text-lg tracking-widest uppercase">Tactical AI Engine</h1>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-sm">
            <span className="text-slate-500">Mode:</span>{' '}
            <span className="text-blue-400 font-bold">Emergency {playerCount}v{playerCount}</span>
          </div>
          <div className="flex items-center gap-2 text-xs bg-slate-800 px-3 py-1 rounded-full text-green-400 border border-green-900/50">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            AI Engine Online
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar - AI Insights */}
        <aside className="w-80 bg-[#0f172a] p-6 border-l border-slate-800 flex flex-col gap-6">
          <div className="space-y-4">
            <div>
              <label className="text-[10px] text-slate-500 font-bold uppercase">الموقف الحالي</label>
              <div className="grid grid-cols-2 gap-2 mt-1">
                <Input
                  type="text"
                  value={matchMinute + "'"}
                  onChange={(e) => setMatchMinute(e.target.value.replace("'", ''))}
                  className="bg-slate-900 border-slate-700 text-center focus:border-blue-500"
                  placeholder="70'"
                />
                <Input
                  type="text"
                  value={currentScore}
                  onChange={(e) => setCurrentScore(e.target.value)}
                  className="bg-slate-900 border-slate-700 text-center focus:border-blue-500"
                  placeholder="0-1"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] text-slate-500 font-bold uppercase">التشكيل</label>
              <div className="grid grid-cols-2 gap-2 mt-1">
                <select
                  value={currentFormation}
                  onChange={(e) => setCurrentFormation(e.target.value)}
                  className="bg-slate-900 border border-slate-700 p-2 rounded text-center focus:border-blue-500 outline-none text-sm"
                >
                  {FORMATIONS.map(f => (
                    <option key={f} value={f}>فريقك: {f}</option>
                  ))}
                </select>
                <select
                  value={opponentFormation}
                  onChange={(e) => setOpponentFormation(e.target.value)}
                  className="bg-slate-900 border border-slate-700 p-2 rounded text-center focus:border-blue-500 outline-none text-sm"
                >
                  {['4-4-1', '4-3-2', '5-3-1', '4-5-0', '3-5-1'].map(f => (
                    <option key={f} value={f}>الخصم: {f}</option>
                  ))}
                </select>
              </div>
            </div>

            <Button
              onClick={handleAnalyze}
              disabled={isAnalyzing}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 shadow-lg shadow-blue-900/20"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              {isAnalyzing ? 'جاري التحليل...' : 'تحليل الذكاء الاصطناعي'}
            </Button>
          </div>

          {/* AI Insights Box */}
          <div className="flex-1 flex flex-col">
            <label className="text-[10px] text-slate-500 font-bold uppercase mb-2">
              AI Insights & Instructions
            </label>
            <div className="flex-1 bg-slate-950 rounded-xl border border-slate-800 p-4 font-mono text-sm leading-relaxed overflow-y-auto">
              <div
                className={`text-slate-400 ${isTyping ? 'border-r-2 border-blue-400 animate-pulse' : ''}`}
                dangerouslySetInnerHTML={{ __html: aiText }}
              />
            </div>
          </div>

          {/* Stats Cards */}
          {tacticalPlan && (
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
                <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                  <Target className="w-3 h-3" />
                  Success Rate
                </div>
                <div className="text-2xl font-bold text-green-400">
                  {tacticalPlan.successRate}%
                </div>
              </div>
              <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
                <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                  <Activity className="w-3 h-3" />
                  Formation
                </div>
                <div className="text-2xl font-bold text-blue-400">
                  {tacticalPlan.formationChange}
                </div>
              </div>
            </div>
          )}
        </aside>

        {/* Main Pitch Area */}
        <main className="flex-1 p-6 flex flex-col">
          <div
            ref={pitchRef}
            className="flex-1 rounded-xl shadow-2xl relative cursor-crosshair overflow-hidden"
            style={{
              backgroundColor: '#2d5a1e',
              backgroundImage: `
                repeating-linear-gradient(
                  90deg,
                  #2d5a1e 0%,
                  #2d5a1e 12.5%,
                  #3a6b28 12.5%,
                  #3a6b28 25%,
                  #2d5a1e 25%,
                  #2d5a1e 37.5%,
                  #3a6b28 37.5%,
                  #3a6b28 50%,
                  #2d5a1e 50%,
                  #2d5a1e 62.5%,
                  #3a6b28 62.5%,
                  #3a6b28 75%,
                  #2d5a1e 75%,
                  #2d5a1e 87.5%,
                  #3a6b28 87.5%,
                  #3a6b28 100%
                )
              `,
              border: '3px solid #1a3a16'
            }}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onClick={handlePitchClick}
          >
            {/* Pitch Boundary */}
            <div className="absolute inset-2 border-2 border-white/30 rounded-sm"></div>
            
            {/* Center Line */}
            <div className="absolute inset-y-2 left-1/2 w-0.5 bg-white/40"></div>
            
            {/* Center Circle */}
            <div 
              className="absolute border-2 border-white/40 rounded-full"
              style={{
                left: '50%',
                top: '50%',
                width: '15%',
                paddingBottom: '15%',
                transform: 'translate(-50%, -50%)'
              }}
            ></div>
            <div 
              className="absolute bg-white/40 rounded-full"
              style={{
                left: '50%',
                top: '50%',
                width: '1.5%',
                paddingBottom: '1.5%',
                transform: 'translate(-50%, -50%)'
              }}
            ></div>
            
            {/* Penalty Areas - Bottom (Your Goal) */}
            <div className="absolute bottom-2 left-1/2 border-2 border-white/40 border-b-0" style={{ width: '40%', height: '16%', transform: 'translateX(-50%)' }}></div>
            <div className="absolute bottom-2 left-1/2 border-2 border-white/40 border-b-0" style={{ width: '18%', height: '8%', transform: 'translateX(-50%)' }}></div>
            
            {/* Penalty Areas - Top (Opponent Goal) */}
            <div className="absolute top-2 left-1/2 border-2 border-white/40 border-t-0" style={{ width: '40%', height: '16%', transform: 'translateX(-50%)' }}></div>
            <div className="absolute top-2 left-1/2 border-2 border-white/40 border-t-0" style={{ width: '18%', height: '8%', transform: 'translateX(-50%)' }}></div>
            
            {/* Goals */}
            <div className="absolute bottom-0 left-1/2 bg-white/10 border-2 border-white/40 border-b-0" style={{ width: '12%', height: '3%', transform: 'translateX(-50%)' }}></div>
            <div className="absolute top-0 left-1/2 bg-white/10 border-2 border-white/40 border-t-0" style={{ width: '12%', height: '3%', transform: 'translateX(-50%)' }}></div>
            
            {/* Corner Arcs */}
            <div className="absolute bottom-2 left-2 border-2 border-white/40 border-r-0 border-t-0 rounded-bl-lg" style={{ width: '3%', height: '3%' }}></div>
            <div className="absolute bottom-2 right-2 border-2 border-white/40 border-l-0 border-t-0 rounded-br-lg" style={{ width: '3%', height: '3%' }}></div>
            <div className="absolute top-2 left-2 border-2 border-white/40 border-r-0 border-b-0 rounded-tl-lg" style={{ width: '3%', height: '3%' }}></div>
            <div className="absolute top-2 right-2 border-2 border-white/40 border-l-0 border-b-0 rounded-tr-lg" style={{ width: '3%', height: '3%' }}></div>

            {/* Ball */}
            {ballPosition && (
              <div
                className="absolute w-6 h-6 rounded-full bg-white shadow-2xl border-2 border-slate-800 flex items-center justify-center"
                style={{
                  left: `${ballPosition.x}%`,
                  top: `${ballPosition.y}%`,
                  transform: 'translate(-50%, -50%)',
                  zIndex: 40,
                  boxShadow: '0 0 20px rgba(255,255,255,0.5)'
                }}
              >
                <div className="w-3 h-3 rounded-full bg-slate-800"></div>
              </div>
            )}

            {/* Opponent Players (Red) */}
            {opponentPlayers.map(player => (
              <div
                key={player.id}
                className={`absolute w-10 h-10 ${player.color} rounded-full flex items-center justify-center font-bold border-2 border-white/30 shadow-xl text-xs`}
                style={{
                  left: `${player.x}%`,
                  top: `${player.y}%`,
                  transform: 'translate(-50%, -50%)',
                  zIndex: 20,
                  opacity: 0.8
                }}
                title={`Opponent ${player.role}`}
              >
                <div className="text-white text-[10px]">{player.role}</div>
              </div>
            ))}

            {/* Your Team Players (Blue/Yellow) */}
            {players.map(player => (
              <div
                key={player.id}
                className={`absolute w-10 h-10 ${player.color} rounded-full flex items-center justify-center font-bold border-2 border-white/30 shadow-xl text-xs transition-transform ${
                  player.isDragging ? 'scale-110 cursor-grabbing' : 'cursor-grab'
                } hover:scale-105`}
                style={{
                  left: `${player.x}%`,
                  top: `${player.y}%`,
                  transform: 'translate(-50%, -50%)',
                  zIndex: player.isDragging ? 50 : 30
                }}
                onMouseDown={() => handleMouseDown(player.id)}
              >
                {player.id}
              </div>
            ))}

            {/* Instructions Overlay */}
            <div className="absolute bottom-4 left-4 bg-slate-900/90 backdrop-blur-sm p-3 rounded-lg border border-slate-700 text-xs">
              <p className="text-slate-400">
                💡 <span className="text-blue-400">Blue</span> = Your team • <span className="text-red-400">Red</span> = Opponents • Drag blue players • Click pitch to place ball ⚽
              </p>
            </div>

            {/* Ball Position Indicator */}
            {ballPosition && (
              <div className="absolute top-4 right-4 bg-slate-900/90 backdrop-blur-sm p-2 rounded-lg border border-slate-700 text-xs flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-white border border-slate-800"></div>
                <span className="text-slate-400">Ball at ({Math.round(ballPosition.x)}%, {Math.round(ballPosition.y)}%)</span>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
