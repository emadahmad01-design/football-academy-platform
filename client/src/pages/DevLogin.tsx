import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function DevLogin() {
  const [, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(false);

  const handleDevLogin = async () => {
    setIsLoading(true);
    try {
      console.log("[DevLogin] Sending login request...");
      const response = await fetch("/api/dev-login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      console.log("[DevLogin] Response status:", response.status);

      if (response.ok) {
        const data = await response.json();
        console.log("[DevLogin] Login successful:", data);
        toast.success("Logged in successfully!");
        
        // Small delay to ensure cookie is set, then force a full page reload
        setTimeout(() => {
          console.log("[DevLogin] Redirecting to dashboard...");
          window.location.href = "/dashboard";
        }, 500);
      } else {
        const error = await response.json();
        console.error("[DevLogin] Login failed:", error);
        toast.error(error.error || "Login failed");
        setIsLoading(false);
      }
    } catch (error) {
      console.error("[DevLogin] Login error:", error);
      toast.error("Login failed. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold">Dev Login</CardTitle>
          <CardDescription>
            Quick login for development testing
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={handleDevLogin}
            disabled={isLoading}
            className="w-full h-12 text-lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Logging in...
              </>
            ) : (
              "Login as Dev User"
            )}
          </Button>
          <p className="text-sm text-muted-foreground text-center">
            This will log you in as a test user with admin access
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
