import { StreakTracker } from '@/components/StreakTracker';

export default function StreakPage() {
  return (
    <div className="container py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Daily Login Streak 🔥</h1>
        <p className="text-muted-foreground">
          Log in every day to maintain your streak and earn rewards!
        </p>
      </div>
      
      <StreakTracker />
    </div>
  );
}
