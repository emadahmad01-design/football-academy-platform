import { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Brain, Send, Loader2, Lightbulb, TrendingUp, Users, Target, User, Shield } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { Streamdown } from 'streamdown';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function AICoachAssistantEnhanced() {
  const [question, setQuestion] = useState('');
  const [conversation, setConversation] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<string>('');
  const [selectedTeam, setSelectedTeam] = useState<string>('');
  const [activeTab, setActiveTab] = useState<string>('general');
  const { language, t } = useLanguage();
  
  const { data: players } = trpc.players.getAll.useQuery();
  const { data: teams } = trpc.teams.getAll.useQuery();
  
  const askCoachMutation = trpc.aiCoach.askQuestion.useMutation({
    onSuccess: (response) => {
      setConversation(prev => [...prev, { role: 'assistant', content: response.answer }]);
    }
  });

  const analyzePlayerMutation = trpc.aiCoach.analyzePlayer.useMutation({
    onSuccess: (response) => {
      setConversation(prev => [
        ...prev, 
        { role: 'user', content: `Analyze player: ${response.playerName}` },
        { role: 'assistant', content: response.analysis }
      ]);
    }
  });

  const handleAsk = () => {
    if (!question.trim()) return;

    setConversation(prev => [...prev, { role: 'user', content: question }]);
    
    const playerId = selectedPlayer ? parseInt(selectedPlayer) : undefined;
    const teamId = selectedTeam ? parseInt(selectedTeam) : undefined;
    
    askCoachMutation.mutate({ 
      question, 
      context: 'tactical',
      playerId,
      teamId
    });
    setQuestion('');
  };

  const handleAnalyzePlayer = () => {
    if (!selectedPlayer) return;
    analyzePlayerMutation.mutate({ playerId: parseInt(selectedPlayer) });
  };

  const quickQuestions = {
    general: [
      {
        icon: Users,
        title: 'Formation Advice',
        question: 'What formation should I use against a team that plays 4-3-3 with high pressing?'
      },
      {
        icon: Target,
        title: 'Attacking Strategy',
        question: 'How can I improve my team\'s attacking transitions from defense to attack?'
      },
      {
        icon: TrendingUp,
        title: 'Player Development',
        question: 'What training drills should I use to develop young midfielders aged 16-18?'
      },
      {
        icon: Lightbulb,
        title: 'Tactical Analysis',
        question: 'How do I analyze opponent\'s weaknesses from video footage?'
      }
    ],
    player: [
      {
        icon: User,
        title: 'Technical Skills',
        question: 'What specific drills can improve this player\'s technical abilities?'
      },
      {
        icon: TrendingUp,
        title: 'Development Plan',
        question: 'Create a 3-month development plan for this player based on their current stats.'
      },
      {
        icon: Target,
        title: 'Position Suitability',
        question: 'Is this player playing in the right position based on their strengths?'
      },
      {
        icon: Lightbulb,
        title: 'Weakness Analysis',
        question: 'What are the main weaknesses I should focus on with this player?'
      }
    ],
    team: [
      {
        icon: Shield,
        title: 'Team Strengths',
        question: 'What are the main strengths of this team that I should leverage?'
      },
      {
        icon: Users,
        title: 'Formation Recommendation',
        question: 'What formation best suits this team\'s player composition?'
      },
      {
        icon: Target,
        title: 'Training Focus',
        question: 'What should be the training focus for this team based on their performance data?'
      },
      {
        icon: TrendingUp,
        title: 'Tactical Approach',
        question: 'What tactical approach should I use with this team in matches?'
      }
    ]
  };

  const currentQuestions = activeTab === 'player' ? quickQuestions.player : 
                          activeTab === 'team' ? quickQuestions.team : 
                          quickQuestions.general;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between" dir={language === 'ar' ? 'rtl' : 'ltr'}>
          <div>
            <h1 className="text-3xl font-bold">
              {language === 'ar' ? 'مساعد المدرب بالذكاء الاصطناعي' : 'AI Coach Assistant'}
            </h1>
            <p className="text-muted-foreground mt-2">
              {language === 'ar' 
                ? 'احصل على نصائح تكتيكية ذكية مبنية على البيانات مدعومة بالذكاء الاصطناعي'
                : 'Get intelligent, data-driven tactical advice powered by AI'}
            </p>
          </div>
          <Badge variant="outline" className="text-lg px-4 py-2">
            <Brain className="h-5 w-5 mr-2" />
            {language === 'ar' ? 'مدعوم بالذكاء الاصطناعي' : 'AI-Powered'}
          </Badge>
        </div>

        {/* Context Selectors */}
        <Card>
          <CardHeader>
            <CardTitle>Analysis Context</CardTitle>
            <CardDescription>
              Select a player or team to get personalized insights based on real performance data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="general">General Advice</TabsTrigger>
                <TabsTrigger value="player">Player Analysis</TabsTrigger>
                <TabsTrigger value="team">Team Analysis</TabsTrigger>
              </TabsList>
              
              <TabsContent value="general" className="mt-4">
                <p className="text-sm text-muted-foreground">
                  Ask general coaching questions about tactics, training, and player development.
                </p>
              </TabsContent>
              
              <TabsContent value="player" className="mt-4 space-y-4">
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="text-sm font-medium mb-2 block">Select Player</label>
                    <Select value={selectedPlayer} onValueChange={setSelectedPlayer}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a player..." />
                      </SelectTrigger>
                      <SelectContent>
                        {players?.map((player) => (
                          <SelectItem key={player.id} value={player.id.toString()}>
                            {player.firstName} {player.lastName} - {player.position} ({player.ageGroup})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-end">
                    <Button 
                      onClick={handleAnalyzePlayer}
                      disabled={!selectedPlayer || analyzePlayerMutation.isPending}
                    >
                      {analyzePlayerMutation.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Analyzing...
                        </>
                      ) : (
                        <>
                          <Brain className="h-4 w-4 mr-2" />
                          Analyze Player
                        </>
                      )}
                    </Button>
                  </div>
                </div>
                {selectedPlayer && (
                  <p className="text-sm text-muted-foreground">
                    AI will analyze this player's performance data and provide personalized insights.
                  </p>
                )}
              </TabsContent>
              
              <TabsContent value="team" className="mt-4">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Select Team</label>
                    <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a team..." />
                      </SelectTrigger>
                      <SelectContent>
                        {teams?.map((team) => (
                          <SelectItem key={team.id} value={team.id.toString()}>
                            {team.name} ({team.ageGroup})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {selectedTeam && (
                    <p className="text-sm text-muted-foreground">
                      AI will analyze this team's composition and performance data for tactical recommendations.
                    </p>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Quick Questions */}
        {conversation.length === 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {currentQuestions.map((q, index) => (
              <Card 
                key={index}
                className="cursor-pointer hover:border-primary transition-colors"
                onClick={() => {
                  if (activeTab === 'player' && !selectedPlayer) {
                    return; // Don't allow player questions without selection
                  }
                  if (activeTab === 'team' && !selectedTeam) {
                    return; // Don't allow team questions without selection
                  }
                  setQuestion(q.question);
                }}
              >
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <q.icon className="h-5 w-5 text-primary" />
                    {q.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{q.question}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Conversation */}
        {conversation.length > 0 && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Conversation</CardTitle>
                <CardDescription>Your coaching consultation with AI</CardDescription>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setConversation([])}
              >
                Clear Chat
              </Button>
            </CardHeader>
            <CardContent className="space-y-4 max-h-[600px] overflow-y-auto">
              {conversation.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-4 ${
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    {message.role === 'assistant' ? (
                      <Streamdown>{message.content}</Streamdown>
                    ) : (
                      <p className="whitespace-pre-wrap">{message.content}</p>
                    )}
                  </div>
                </div>
              ))}
              
              {(askCoachMutation.isPending || analyzePlayerMutation.isPending) && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-lg p-4 flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">AI is thinking...</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Input Area */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-2">
              <Textarea
                placeholder="Ask your coaching question here..."
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleAsk();
                  }
                }}
                className="min-h-[100px]"
              />
              <Button 
                onClick={handleAsk}
                disabled={!question.trim() || askCoachMutation.isPending}
                size="lg"
              >
                {askCoachMutation.isPending ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Press Enter to send, Shift+Enter for new line
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
