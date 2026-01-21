import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Brain, Send, Loader2, Lightbulb, TrendingUp, Users, Target } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { Streamdown } from 'streamdown';

export default function AICoachAssistant() {
  const [question, setQuestion] = useState('');
  const [conversation, setConversation] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
  
  const askCoachMutation = trpc.aiCoach.askQuestion.useMutation({
    onSuccess: (response) => {
      setConversation(prev => [...prev, { role: 'assistant', content: response.answer }]);
    }
  });

  const handleAsk = () => {
    if (!question.trim()) return;

    setConversation(prev => [...prev, { role: 'user', content: question }]);
    askCoachMutation.mutate({ question, context: 'tactical' });
    setQuestion('');
  };

  const quickQuestions = [
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
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">AI Coach Assistant</h1>
          <p className="text-muted-foreground mt-2">
            Get intelligent tactical advice powered by advanced AI
          </p>
        </div>
        <Badge variant="outline" className="text-lg px-4 py-2">
          <Brain className="h-5 w-5 mr-2" />
          AI-Powered
        </Badge>
      </div>

      {/* Quick Questions */}
      {conversation.length === 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {quickQuestions.map((q, index) => (
            <Card 
              key={index}
              className="cursor-pointer hover:border-primary transition-colors"
              onClick={() => setQuestion(q.question)}
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
          <CardHeader>
            <CardTitle>Conversation</CardTitle>
            <CardDescription>Your coaching consultation with AI</CardDescription>
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
            
            {askCoachMutation.isPending && (
              <div className="flex justify-start">
                <div className="max-w-[80%] rounded-lg p-4 bg-muted">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>AI Coach is thinking...</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Input */}
      <Card>
        <CardHeader>
          <CardTitle>Ask Your Question</CardTitle>
          <CardDescription>
            Ask about tactics, formations, training, player development, or match analysis
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Example: How should I set up my defense against a team with fast wingers?"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            rows={4}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleAsk();
              }
            }}
          />
          <Button 
            onClick={handleAsk} 
            disabled={!question.trim() || askCoachMutation.isPending}
            className="w-full"
          >
            {askCoachMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Ask AI Coach
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Features */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Tactical Expertise</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Get advice on formations, pressing systems, build-up play, and defensive organization
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Training Programs</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Receive customized training drills and session plans for different age groups
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Match Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Learn how to analyze opponents, identify weaknesses, and prepare tactical plans
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Disclaimer */}
      <Card className="border-yellow-500/50 bg-yellow-500/5">
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">
            <strong>Note:</strong> AI Coach Assistant provides general tactical advice based on football knowledge. 
            Always adapt suggestions to your specific team, players, and match context.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
