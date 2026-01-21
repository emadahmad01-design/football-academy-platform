import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, CheckCircle2, AlertCircle } from "lucide-react";

interface PositionRecommendation {
  position: string;
  suitabilityScore: number;
  confidence: 'high' | 'medium' | 'low';
  strengths: string[];
  improvements: string[];
}

interface PositionRecommendationProps {
  recommendations: PositionRecommendation[];
}

const POSITION_NAMES: Record<string, string> = {
  GK: 'Goalkeeper',
  CB: 'Center Back',
  LB: 'Left Back',
  RB: 'Right Back',
  CDM: 'Defensive Midfielder',
  CM: 'Central Midfielder',
  CAM: 'Attacking Midfielder',
  LW: 'Left Winger',
  RW: 'Right Winger',
  ST: 'Striker',
};

const getConfidenceColor = (confidence: string) => {
  switch (confidence) {
    case 'high':
      return 'bg-green-500/10 text-green-500 border-green-500/20';
    case 'medium':
      return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
    case 'low':
      return 'bg-red-500/10 text-red-500 border-red-500/20';
    default:
      return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
  }
};

const getScoreColor = (score: number) => {
  if (score >= 75) return 'text-green-500';
  if (score >= 60) return 'text-yellow-500';
  return 'text-red-500';
};

export function PositionRecommendationCard({ recommendations }: PositionRecommendationProps) {
  const topRecommendations = recommendations.slice(0, 3);
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          AI Position Recommendations
        </CardTitle>
        <CardDescription>
          Based on player's skill profile and attributes
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {topRecommendations.map((rec, index) => (
          <div
            key={rec.position}
            className="border rounded-lg p-4 space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold">
                  {index + 1}
                </div>
                <div>
                  <h3 className="font-semibold text-lg">
                    {POSITION_NAMES[rec.position] || rec.position}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {rec.position}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className={`text-2xl font-bold ${getScoreColor(rec.suitabilityScore)}`}>
                  {rec.suitabilityScore}%
                </div>
                <Badge className={getConfidenceColor(rec.confidence)}>
                  {rec.confidence} confidence
                </Badge>
              </div>
            </div>
            
            {rec.strengths.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium">Strengths</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {rec.strengths.map((strength) => (
                    <Badge
                      key={strength}
                      variant="outline"
                      className="bg-green-500/10 text-green-500 border-green-500/20"
                    >
                      {strength}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            
            {rec.improvements.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm font-medium">Areas to Improve</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {rec.improvements.map((improvement) => (
                    <Badge
                      key={improvement}
                      variant="outline"
                      className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
                    >
                      {improvement}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
