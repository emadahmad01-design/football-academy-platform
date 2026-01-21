import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, Mail, Home } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";

export default function PendingApproval() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full bg-slate-800 border-slate-700">
        <CardContent className="pt-12 pb-12 text-center">
          <div className="mb-8">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-yellow-500/10 mb-6">
              <Clock className="w-12 h-12 text-yellow-500" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-4">Account Pending Approval</h1>
            <p className="text-slate-300 text-lg mb-6">
              Thank you for registering with Future Stars FC Academy!
            </p>
            <div className="bg-slate-700/50 rounded-lg p-6 mb-8 text-left max-w-md mx-auto">
              <h2 className="text-white font-semibold mb-3 flex items-center gap-2">
                <Mail className="w-5 h-5 text-emerald-500" />
                What happens next?
              </h2>
              <ul className="text-slate-300 space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-500 mt-1">•</span>
                  <span>Our administrators are reviewing your registration request</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-500 mt-1">•</span>
                  <span>You'll receive an email notification once your account is approved</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-500 mt-1">•</span>
                  <span>This process typically takes 1-2 business days</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-500 mt-1">•</span>
                  <span>Once approved, you'll have full access to the platform</span>
                </li>
              </ul>
            </div>
            {user && (
              <div className="bg-slate-700/30 rounded-lg p-4 mb-6 max-w-md mx-auto">
                <p className="text-slate-400 text-sm mb-1">Registered as:</p>
                <p className="text-white font-semibold">{user.name}</p>
                <p className="text-slate-300 text-sm">{user.email}</p>
                {user.requestedRole && (
                  <p className="text-slate-400 text-sm mt-2">
                    Requested role: <span className="text-emerald-500 capitalize">{user.requestedRole.replace("_", " ")}</span>
                  </p>
                )}
              </div>
            )}
            <div className="flex gap-4 justify-center">
              <Link href="/">
                <Button variant="outline" className="border-slate-600 text-slate-300">
                  <Home className="w-4 h-4 mr-2" />
                  Back to Home
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
