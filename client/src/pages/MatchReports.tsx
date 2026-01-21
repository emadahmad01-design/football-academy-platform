import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  FileText, 
  Download, 
  Calendar,
  TrendingUp,
  Target,
  Users,
  Activity,
  Award,
  Clock,
  MapPin,
  Plus
} from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import jsPDF from 'jspdf';

interface MatchReport {
  id: number;
  matchDate: string;
  opponent: string;
  venue: string;
  result: string;
  score: string;
  formation: string;
  possession: number;
  passingAccuracy: number;
  xG: number;
  xGA: number;
  shots: number;
  shotsOnTarget: number;
  tackles: number;
  interceptions: number;
  keyPlayers: string[];
  substitutions: Array<{
    minute: number;
    playerOut: string;
    playerIn: string;
    reason: string;
  }>;
  tacticalNotes: string;
  coachObservations: string;
}

export default function MatchReports() {
  const [selectedReport, setSelectedReport] = useState<MatchReport | null>(null);
  
  // Mock data - in real app, this would come from database
  const mockReports: MatchReport[] = [
    {
      id: 1,
      matchDate: '2025-12-20',
      opponent: 'Al Ahly Youth',
      venue: 'Home',
      result: 'Win',
      score: '3-1',
      formation: '4-3-3',
      possession: 58,
      passingAccuracy: 82,
      xG: 2.4,
      xGA: 0.8,
      shots: 15,
      shotsOnTarget: 8,
      tackles: 18,
      interceptions: 12,
      keyPlayers: ['Ahmed Hassan (#10)', 'Mohamed Ali (#9)', 'Omar Khaled (#7)'],
      substitutions: [
        { minute: 65, playerOut: 'Youssef Ibrahim', playerIn: 'Karim Mostafa', reason: 'Tactical - Fresh legs' },
        { minute: 78, playerOut: 'Ahmed Hassan', playerIn: 'Ali Mahmoud', reason: 'Injury prevention' }
      ],
      tacticalNotes: 'Successfully implemented high press in first half. Switched to counter-attack after 2-0 lead. Wing play was effective with overlapping fullbacks.',
      coachObservations: 'Team showed great discipline and tactical awareness. Need to work on maintaining possession in final third. Defensive transitions were excellent.'
    },
    {
      id: 2,
      matchDate: '2025-12-15',
      opponent: 'Zamalek Academy',
      venue: 'Away',
      result: 'Draw',
      score: '2-2',
      formation: '4-2-3-1',
      possession: 45,
      passingAccuracy: 76,
      xG: 1.8,
      xGA: 2.1,
      shots: 12,
      shotsOnTarget: 6,
      tackles: 22,
      interceptions: 15,
      keyPlayers: ['Mohamed Ali (#9)', 'Hassan Ahmed (#6)', 'Omar Khaled (#7)'],
      substitutions: [
        { minute: 60, playerOut: 'Ali Mahmoud', playerIn: 'Karim Mostafa', reason: 'Tactical - More attacking' },
        { minute: 82, playerOut: 'Hassan Ahmed', playerIn: 'Youssef Ibrahim', reason: 'Fatigue' }
      ],
      tacticalNotes: 'Struggled with opponent\'s high press. Improved after switching to direct play. Set pieces were dangerous.',
      coachObservations: 'Need better ball retention under pressure. Defensive organization was good but individual errors cost us. Positive response after going behind.'
    }
  ];

  const handleExportPDF = (report: MatchReport) => {
    try {
      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.getWidth();
      let yPos = 20;

      // Header
      pdf.setFontSize(24);
      pdf.setTextColor(249, 115, 22); // Orange
      pdf.text('Match Report', pageWidth / 2, yPos, { align: 'center' });
      yPos += 15;

      // Match Info
      pdf.setFontSize(16);
      pdf.setTextColor(0, 0, 0);
      pdf.text(`vs ${report.opponent}`, pageWidth / 2, yPos, { align: 'center' });
      yPos += 10;
      
      pdf.setFontSize(12);
      pdf.setTextColor(100, 100, 100);
      pdf.text(`${new Date(report.matchDate).toLocaleDateString()} - ${report.venue}`, pageWidth / 2, yPos, { align: 'center' });
      yPos += 15;

      // Result Box
      pdf.setFillColor(249, 115, 22);
      pdf.rect(pageWidth / 2 - 30, yPos, 60, 15, 'F');
      pdf.setFontSize(18);
      pdf.setTextColor(255, 255, 255);
      pdf.text(`${report.result}: ${report.score}`, pageWidth / 2, yPos + 10, { align: 'center' });
      yPos += 25;

      // Performance Metrics
      pdf.setFontSize(14);
      pdf.setTextColor(0, 0, 0);
      pdf.text('Performance Metrics', 20, yPos);
      yPos += 10;

      pdf.setFontSize(10);
      const metrics = [
        `Formation: ${report.formation}`,
        `Possession: ${report.possession}%`,
        `Pass Accuracy: ${report.passingAccuracy}%`,
        `xG: ${report.xG} | xGA: ${report.xGA}`,
        `Shots: ${report.shots} (${report.shotsOnTarget} on target)`,
        `Tackles: ${report.tackles} | Interceptions: ${report.interceptions}`
      ];

      metrics.forEach(metric => {
        pdf.text(metric, 25, yPos);
        yPos += 7;
      });
      yPos += 5;

      // Key Players
      pdf.setFontSize(14);
      pdf.text('Key Players', 20, yPos);
      yPos += 10;
      
      pdf.setFontSize(10);
      report.keyPlayers.forEach((player, index) => {
        pdf.text(`${index + 1}. ${player}`, 25, yPos);
        yPos += 7;
      });
      yPos += 5;

      // Substitutions
      if (yPos > 250) {
        pdf.addPage();
        yPos = 20;
      }
      
      pdf.setFontSize(14);
      pdf.text('Substitutions', 20, yPos);
      yPos += 10;
      
      pdf.setFontSize(10);
      report.substitutions.forEach(sub => {
        pdf.text(`${sub.minute}' - OUT: ${sub.playerOut} | IN: ${sub.playerIn}`, 25, yPos);
        yPos += 5;
        pdf.setTextColor(100, 100, 100);
        pdf.text(`Reason: ${sub.reason}`, 30, yPos);
        pdf.setTextColor(0, 0, 0);
        yPos += 8;
      });
      yPos += 5;

      // Tactical Notes
      if (yPos > 230) {
        pdf.addPage();
        yPos = 20;
      }
      
      pdf.setFontSize(14);
      pdf.text('Tactical Notes', 20, yPos);
      yPos += 10;
      
      pdf.setFontSize(10);
      const tacticalLines = pdf.splitTextToSize(report.tacticalNotes, pageWidth - 50);
      pdf.text(tacticalLines, 25, yPos);
      yPos += tacticalLines.length * 7 + 10;

      // Coach Observations
      if (yPos > 230) {
        pdf.addPage();
        yPos = 20;
      }
      
      pdf.setFontSize(14);
      pdf.text('Coach Observations', 20, yPos);
      yPos += 10;
      
      pdf.setFontSize(10);
      const observationLines = pdf.splitTextToSize(report.coachObservations, pageWidth - 50);
      pdf.text(observationLines, 25, yPos);

      // Footer
      const pageCount = pdf.internal.pages.length - 1;
      for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.setTextColor(150, 150, 150);
        pdf.text(
          `Football Academy Platform - Generated on ${new Date().toLocaleDateString()}`,
          pageWidth / 2,
          pdf.internal.pageSize.getHeight() - 10,
          { align: 'center' }
        );
      }

      // Save PDF
      pdf.save(`Match_Report_${report.opponent}_${report.matchDate}.pdf`);
      toast.success('Match report exported successfully!');
    } catch (error) {
      console.error('PDF export error:', error);
      toast.error('Failed to export PDF');
    }
  };

  const handleEmailReport = (report: MatchReport) => {
    toast.success(`Sending report via email: ${report.opponent}`);
    // In real app, this would send email
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">
              Match Reports
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              Comprehensive match analysis and performance tracking
            </p>
          </div>
          <Button className="bg-orange-500 hover:bg-orange-600">
            <Plus className="w-4 h-4 mr-2" />
            New Report
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Reports List */}
          <div className="lg:col-span-1 space-y-4">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
              Recent Matches
            </h2>
            {mockReports.map(report => (
              <Card 
                key={report.id}
                className={`cursor-pointer transition-all hover:shadow-lg ${
                  selectedReport?.id === report.id ? 'ring-2 ring-orange-500' : ''
                }`}
                onClick={() => setSelectedReport(report)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      report.result === 'Win' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                      report.result === 'Draw' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                      'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                    }`}>
                      {report.result}
                    </span>
                    <span className="text-lg font-bold text-slate-900 dark:text-white">
                      {report.score}
                    </span>
                  </div>
                  <h3 className="font-semibold text-slate-900 dark:text-white mb-1">
                    vs {report.opponent}
                  </h3>
                  <div className="flex items-center gap-4 text-xs text-slate-600 dark:text-slate-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(report.matchDate).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {report.venue}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Report Details */}
          <div className="lg:col-span-2">
            {selectedReport ? (
              <div className="space-y-6">
                {/* Match Overview */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Match Overview</CardTitle>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleEmailReport(selectedReport)}
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        Email
                      </Button>
                      <Button 
                        size="sm"
                        className="bg-orange-500 hover:bg-orange-600"
                        onClick={() => handleExportPDF(selectedReport)}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Export PDF
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-4 bg-slate-100 dark:bg-slate-800 rounded-lg">
                        <div className="text-2xl font-bold text-slate-900 dark:text-white">
                          {selectedReport.score}
                        </div>
                        <div className="text-sm text-slate-600 dark:text-slate-400">Final Score</div>
                      </div>
                      <div className="text-center p-4 bg-slate-100 dark:bg-slate-800 rounded-lg">
                        <div className="text-2xl font-bold text-slate-900 dark:text-white">
                          {selectedReport.formation}
                        </div>
                        <div className="text-sm text-slate-600 dark:text-slate-400">Formation</div>
                      </div>
                      <div className="text-center p-4 bg-slate-100 dark:bg-slate-800 rounded-lg">
                        <div className="text-2xl font-bold text-slate-900 dark:text-white">
                          {selectedReport.possession}%
                        </div>
                        <div className="text-sm text-slate-600 dark:text-slate-400">Possession</div>
                      </div>
                      <div className="text-center p-4 bg-slate-100 dark:bg-slate-800 rounded-lg">
                        <div className="text-2xl font-bold text-slate-900 dark:text-white">
                          {selectedReport.passingAccuracy}%
                        </div>
                        <div className="text-sm text-slate-600 dark:text-slate-400">Pass Accuracy</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Performance Metrics */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="w-5 h-5" />
                      Performance Metrics
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Target className="w-4 h-4 text-orange-500" />
                          <span className="text-sm font-medium text-slate-600 dark:text-slate-400">xG</span>
                        </div>
                        <div className="text-2xl font-bold text-slate-900 dark:text-white">
                          {selectedReport.xG}
                        </div>
                      </div>
                      <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Target className="w-4 h-4 text-red-500" />
                          <span className="text-sm font-medium text-slate-600 dark:text-slate-400">xGA</span>
                        </div>
                        <div className="text-2xl font-bold text-slate-900 dark:text-white">
                          {selectedReport.xGA}
                        </div>
                      </div>
                      <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <TrendingUp className="w-4 h-4 text-blue-500" />
                          <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Shots</span>
                        </div>
                        <div className="text-2xl font-bold text-slate-900 dark:text-white">
                          {selectedReport.shots} ({selectedReport.shotsOnTarget})
                        </div>
                      </div>
                      <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Users className="w-4 h-4 text-green-500" />
                          <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Tackles</span>
                        </div>
                        <div className="text-2xl font-bold text-slate-900 dark:text-white">
                          {selectedReport.tackles}
                        </div>
                      </div>
                      <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Activity className="w-4 h-4 text-purple-500" />
                          <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Interceptions</span>
                        </div>
                        <div className="text-2xl font-bold text-slate-900 dark:text-white">
                          {selectedReport.interceptions}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Key Players */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Award className="w-5 h-5" />
                      Key Players
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {selectedReport.keyPlayers.map((player, index) => (
                        <div 
                          key={index}
                          className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg"
                        >
                          <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-white font-semibold">
                            {index + 1}
                          </div>
                          <span className="font-medium text-slate-900 dark:text-white">
                            {player}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Substitutions */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="w-5 h-5" />
                      Substitutions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {selectedReport.substitutions.map((sub, index) => (
                        <div 
                          key={index}
                          className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-semibold text-orange-600 dark:text-orange-400">
                              {sub.minute}'
                            </span>
                            <span className="text-xs text-slate-600 dark:text-slate-400">
                              {sub.reason}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-red-600 dark:text-red-400">OUT: {sub.playerOut}</span>
                            <span className="text-slate-400">→</span>
                            <span className="text-green-600 dark:text-green-400">IN: {sub.playerIn}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Tactical Notes */}
                <Card>
                  <CardHeader>
                    <CardTitle>Tactical Notes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                      {selectedReport.tacticalNotes}
                    </p>
                  </CardContent>
                </Card>

                {/* Coach Observations */}
                <Card>
                  <CardHeader>
                    <CardTitle>Coach Observations</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                      {selectedReport.coachObservations}
                    </p>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card className="h-full flex items-center justify-center p-12">
                <div className="text-center">
                  <FileText className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                    No Report Selected
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400">
                    Select a match from the list to view detailed report
                  </p>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
