import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { DashboardLayoutSkeleton } from "@/components/DashboardLayoutSkeleton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { 
  Trophy, 
  Calendar, 
  Star, 
  TrendingUp, 
  TrendingDown,
  Minus,
  Medal,
  Target
} from "lucide-react";

// Form indicator component
function FormIndicator({ result }: { result: string }) {
  const colors: Record<string, string> = {
    W: "bg-green-500",
    D: "bg-yellow-500",
    L: "bg-red-500",
  };
  return (
    <span className={`w-6 h-6 rounded-full ${colors[result] || "bg-muted"} flex items-center justify-center text-xs font-bold text-white`}>
      {result}
    </span>
  );
}

export default function League() {
  const { user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();

  const { data: standings, isLoading: standingsLoading } = trpc.league.getStandings.useQuery({
    season: "2024-2025",
    leagueName: "Future Stars League"
  });

  const { data: upcomingMatches, isLoading: matchesLoading } = trpc.matches.getAll.useQuery();
  const { data: recentResults } = trpc.matches.getAll.useQuery();

  if (authLoading) return <DashboardLayoutSkeleton />;
  if (!user) {
    setLocation("/");
    return null;
  }

  const isLoading = standingsLoading || matchesLoading;

  // Sort matches by date
  const sortedMatches = upcomingMatches?.sort((a: any, b: any) => 
    new Date(a.matchDate).getTime() - new Date(b.matchDate).getTime()
  ) || [];

  const upcoming = sortedMatches.filter((m: any) => new Date(m.matchDate) >= new Date());
  const past = sortedMatches.filter((m: any) => new Date(m.matchDate) < new Date()).reverse();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Trophy className="h-8 w-8 text-primary" />
              League & Fixtures
            </h1>
            <p className="text-muted-foreground mt-1">
              Season 2024-2025 standings and match schedule
            </p>
          </div>
        </div>

        <Tabs defaultValue="standings" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="standings">Standings</TabsTrigger>
            <TabsTrigger value="fixtures">Fixtures</TabsTrigger>
            <TabsTrigger value="results">Results</TabsTrigger>
          </TabsList>

          {/* League Standings */}
          <TabsContent value="standings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Medal className="h-5 w-5 text-primary" />
                  Future Stars League - 2024/25
                </CardTitle>
                <CardDescription>Current league standings</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : standings && standings.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border text-left">
                          <th className="pb-3 pl-2 w-12">#</th>
                          <th className="pb-3">Team</th>
                          <th className="pb-3 text-center">P</th>
                          <th className="pb-3 text-center">W</th>
                          <th className="pb-3 text-center">D</th>
                          <th className="pb-3 text-center">L</th>
                          <th className="pb-3 text-center">GF</th>
                          <th className="pb-3 text-center">GA</th>
                          <th className="pb-3 text-center">GD</th>
                          <th className="pb-3 text-center font-bold">Pts</th>
                          <th className="pb-3 text-center">Form</th>
                        </tr>
                      </thead>
                      <tbody>
                        {standings.map((team, index) => (
                          <tr 
                            key={team.id} 
                            className={`border-b border-border/50 hover:bg-muted/50 transition-colors ${
                              index < 3 ? "bg-primary/5" : ""
                            }`}
                          >
                            <td className="py-3 pl-2">
                              <span className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold ${
                                index === 0 ? "bg-yellow-500 text-black" :
                                index === 1 ? "bg-gray-400 text-black" :
                                index === 2 ? "bg-amber-700 text-white" :
                                "bg-muted text-muted-foreground"
                              }`}>
                                {index + 1}
                              </span>
                            </td>
                            <td className="py-3 font-medium">{team.teamName || `Team ${team.teamId}`}</td>
                            <td className="py-3 text-center text-muted-foreground">{team.played}</td>
                            <td className="py-3 text-center text-green-500 font-medium">{team.won}</td>
                            <td className="py-3 text-center text-yellow-500">{team.drawn}</td>
                            <td className="py-3 text-center text-red-500">{team.lost}</td>
                            <td className="py-3 text-center">{team.goalsFor}</td>
                            <td className="py-3 text-center">{team.goalsAgainst}</td>
                            <td className="py-3 text-center">
                              <span className={(team.goalDifference ?? 0) > 0 ? "text-green-500" : (team.goalDifference ?? 0) < 0 ? "text-red-500" : ""}>
                                {(team.goalDifference ?? 0) > 0 ? "+" : ""}{team.goalDifference ?? 0}
                              </span>
                            </td>
                            <td className="py-3 text-center font-bold text-lg text-primary">{team.points}</td>
                            <td className="py-3">
                              <div className="flex gap-1 justify-center">
                                {team.form?.split("").slice(-5).map((result: string, i: number) => (
                                  <FormIndicator key={i} result={result} />
                                ))}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No standings data available yet</p>
                    <p className="text-sm mt-2">League standings will appear here once matches are played</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Top Scorers */}
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-primary" />
                    Top Scorers
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      { name: "Ahmed Hassan", team: "U-14 Elite", goals: 12 },
                      { name: "Mohamed Ali", team: "U-16 Premier", goals: 10 },
                      { name: "Omar Khaled", team: "U-14 Elite", goals: 8 },
                      { name: "Youssef Nour", team: "U-12 Stars", goals: 7 },
                      { name: "Karim Mostafa", team: "U-18 Academy", goals: 6 },
                    ].map((player, i) => (
                      <div key={i} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50">
                        <div className="flex items-center gap-3">
                          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                            i === 0 ? "bg-yellow-500 text-black" :
                            i === 1 ? "bg-gray-400 text-black" :
                            i === 2 ? "bg-amber-700 text-white" :
                            "bg-muted text-muted-foreground"
                          }`}>
                            {i + 1}
                          </span>
                          <div>
                            <p className="font-medium">{player.name}</p>
                            <p className="text-xs text-muted-foreground">{player.team}</p>
                          </div>
                        </div>
                        <span className="text-xl font-bold text-primary">{player.goals}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="h-5 w-5 text-primary" />
                    Top Assists
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      { name: "Ali Ibrahim", team: "U-16 Premier", assists: 9 },
                      { name: "Hassan Mahmoud", team: "U-14 Elite", assists: 7 },
                      { name: "Tarek Samir", team: "U-18 Academy", assists: 6 },
                      { name: "Nabil Fathy", team: "U-12 Stars", assists: 5 },
                      { name: "Amr Salah", team: "U-14 Elite", assists: 5 },
                    ].map((player, i) => (
                      <div key={i} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50">
                        <div className="flex items-center gap-3">
                          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                            i === 0 ? "bg-yellow-500 text-black" :
                            i === 1 ? "bg-gray-400 text-black" :
                            i === 2 ? "bg-amber-700 text-white" :
                            "bg-muted text-muted-foreground"
                          }`}>
                            {i + 1}
                          </span>
                          <div>
                            <p className="font-medium">{player.name}</p>
                            <p className="text-xs text-muted-foreground">{player.team}</p>
                          </div>
                        </div>
                        <span className="text-xl font-bold text-primary">{player.assists}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Upcoming Fixtures */}
          <TabsContent value="fixtures" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  Upcoming Fixtures
                </CardTitle>
                <CardDescription>Scheduled matches</CardDescription>
              </CardHeader>
              <CardContent>
                {upcoming.length > 0 ? (
                  <div className="space-y-4">
                    {upcoming.map((match: any) => (
                      <div key={match.id} className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-border hover:border-primary/50 transition-colors">
                        <div className="flex-1">
                          <div className="flex items-center gap-4">
                            <div className="text-right flex-1">
                              <p className="font-bold">{match.isHome ? "Future Stars FC" : match.opponent}</p>
                              <p className="text-xs text-muted-foreground">{match.isHome ? "Home" : "Away"}</p>
                            </div>
                            <div className="text-center px-4">
                              <p className="text-2xl font-bold text-muted-foreground">vs</p>
                            </div>
                            <div className="text-left flex-1">
                              <p className="font-bold">{match.isHome ? match.opponent : "Future Stars FC"}</p>
                              <p className="text-xs text-muted-foreground">{match.isHome ? "Away" : "Home"}</p>
                            </div>
                          </div>
                        </div>
                        <div className="text-right ml-4">
                          <p className="font-medium">{new Date(match.matchDate).toLocaleDateString()}</p>
                          <Badge variant="outline" className="mt-1">{match.matchType}</Badge>
                          <p className="text-xs text-muted-foreground mt-1">{match.venue}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No upcoming fixtures scheduled</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Match Results */}
          <TabsContent value="results" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-primary" />
                  Recent Results
                </CardTitle>
                <CardDescription>Completed matches</CardDescription>
              </CardHeader>
              <CardContent>
                {past.length > 0 ? (
                  <div className="space-y-4">
                    {past.map((match: any) => (
                      <div key={match.id} className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-border hover:border-primary/50 transition-colors">
                        <div className="flex-1">
                          <div className="flex items-center gap-4">
                            <div className="text-right flex-1">
                              <p className="font-bold">{match.isHome ? "Future Stars FC" : match.opponent}</p>
                            </div>
                            <div className="text-center px-4">
                              <div className={`text-2xl font-bold px-4 py-1 rounded-lg ${
                                match.result === 'win' ? 'bg-green-500/20 text-green-500' :
                                match.result === 'loss' ? 'bg-red-500/20 text-red-500' :
                                'bg-yellow-500/20 text-yellow-500'
                              }`}>
                                {match.teamScore} - {match.opponentScore}
                              </div>
                            </div>
                            <div className="text-left flex-1">
                              <p className="font-bold">{match.isHome ? match.opponent : "Future Stars FC"}</p>
                            </div>
                          </div>
                        </div>
                        <div className="text-right ml-4">
                          <p className="font-medium">{new Date(match.matchDate).toLocaleDateString()}</p>
                          <Badge variant={
                            match.result === 'win' ? 'default' :
                            match.result === 'loss' ? 'destructive' :
                            'secondary'
                          } className="mt-1">
                            {match.result === 'win' ? (
                              <><TrendingUp className="h-3 w-3 mr-1" /> Win</>
                            ) : match.result === 'loss' ? (
                              <><TrendingDown className="h-3 w-3 mr-1" /> Loss</>
                            ) : (
                              <><Minus className="h-3 w-3 mr-1" /> Draw</>
                            )}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No match results yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
