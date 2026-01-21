import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { DashboardLayoutSkeleton } from "@/components/DashboardLayoutSkeleton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { Calendar as CalendarIcon, Clock, User, DollarSign, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

export default function BookPrivateSession() {
  const { user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [selectedCoach, setSelectedCoach] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [duration, setDuration] = useState<number>(60);
  const [sessionType, setSessionType] = useState<string>("technical");
  const [notes, setNotes] = useState<string>("");

  const { data: coaches, isLoading: coachesLoading } = trpc.coaches.getAvailable.useQuery();

  const createBooking = trpc.privateBookings.create.useMutation({
    onSuccess: () => {
      toast.success("Booking created successfully! The coach will confirm your session soon.");
      setLocation("/dashboard/my-bookings");
    },
    onError: (error) => {
      toast.error("Failed to create booking: " + error.message);
    },
  });

  if (authLoading) return <DashboardLayoutSkeleton />;
  
  if (!user) {
    setLocation("/");
    return null;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedCoach) {
      toast.error("Please select a coach");
      return;
    }

    if (!selectedDate) {
      toast.error("Please select a date");
      return;
    }

    if (!selectedTime) {
      toast.error("Please select a time");
      return;
    }

    // Combine date and time
    const [hours, minutes] = selectedTime.split(":").map(Number);
    const sessionDateTime = new Date(selectedDate);
    sessionDateTime.setHours(hours, minutes, 0, 0);

    createBooking.mutate({
      coachId: selectedCoach,
      sessionDate: sessionDateTime.toISOString(),
      duration,
      sessionType,
      notes,
    });
  };

  const selectedCoachData = coaches?.find((c: any) => c.id === selectedCoach);
  const sessionPrice = duration === 60 ? 300 : duration === 90 ? 400 : 200;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <CalendarIcon className="w-8 h-8" />
            Book Private Training Session
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Schedule a one-on-one session with our expert coaches
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Booking Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Session Details</CardTitle>
                <CardDescription>
                  Fill in the details below to book your private training session
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Coach Selection */}
                  <div className="space-y-2">
                    <Label htmlFor="coach">Select Coach *</Label>
                    {coachesLoading ? (
                      <div className="text-sm text-gray-500">Loading coaches...</div>
                    ) : (
                      <Select
                        value={selectedCoach?.toString()}
                        onValueChange={(value) => setSelectedCoach(parseInt(value))}
                      >
                        <SelectTrigger id="coach">
                          <SelectValue placeholder="Choose a coach" />
                        </SelectTrigger>
                        <SelectContent>
                          {coaches?.map((coach: any) => (
                            <SelectItem key={coach.id} value={coach.id.toString()}>
                              <div className="flex items-center gap-2">
                                <User className="w-4 h-4" />
                                {coach.name} - {coach.specialty || "General Coach"}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>

                  {/* Date Selection */}
                  <div className="space-y-2">
                    <Label>Select Date *</Label>
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      disabled={(date) => date < new Date() || date.getDay() === 0}
                      className="rounded-md border"
                    />
                  </div>

                  {/* Time Selection */}
                  <div className="space-y-2">
                    <Label htmlFor="time">Select Time *</Label>
                    <Select value={selectedTime} onValueChange={setSelectedTime}>
                      <SelectTrigger id="time">
                        <SelectValue placeholder="Choose a time slot" />
                      </SelectTrigger>
                      <SelectContent>
                        {["09:00", "10:30", "12:00", "14:00", "15:30", "17:00", "18:30"].map((time) => (
                          <SelectItem key={time} value={time}>
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4" />
                              {time}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Duration */}
                  <div className="space-y-2">
                    <Label htmlFor="duration">Session Duration *</Label>
                    <Select
                      value={duration.toString()}
                      onValueChange={(value) => setDuration(parseInt(value))}
                    >
                      <SelectTrigger id="duration">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="30">30 minutes - EGP 200</SelectItem>
                        <SelectItem value="60">60 minutes - EGP 300</SelectItem>
                        <SelectItem value="90">90 minutes - EGP 400</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Session Type */}
                  <div className="space-y-2">
                    <Label htmlFor="sessionType">Session Focus *</Label>
                    <Select value={sessionType} onValueChange={setSessionType}>
                      <SelectTrigger id="sessionType">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="technical">Technical Skills</SelectItem>
                        <SelectItem value="tactical">Tactical Understanding</SelectItem>
                        <SelectItem value="physical">Physical Conditioning</SelectItem>
                        <SelectItem value="mental">Mental Preparation</SelectItem>
                        <SelectItem value="goalkeeping">Goalkeeping</SelectItem>
                        <SelectItem value="general">General Development</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Notes */}
                  <div className="space-y-2">
                    <Label htmlFor="notes">Additional Notes (Optional)</Label>
                    <Textarea
                      id="notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Any specific goals or areas you'd like to focus on..."
                      rows={4}
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={createBooking.isPending}
                  >
                    {createBooking.isPending ? "Creating Booking..." : "Book Session"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Booking Summary */}
          <div>
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle>Booking Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedCoachData && (
                  <div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Coach</div>
                    <div className="font-semibold">{selectedCoachData.name}</div>
                    {selectedCoachData.specialty && (
                      <Badge variant="outline" className="mt-1">
                        {selectedCoachData.specialty}
                      </Badge>
                    )}
                  </div>
                )}

                {selectedDate && (
                  <div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Date</div>
                    <div className="font-semibold">
                      {selectedDate.toLocaleDateString("en-US", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </div>
                  </div>
                )}

                {selectedTime && (
                  <div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Time</div>
                    <div className="font-semibold">{selectedTime}</div>
                  </div>
                )}

                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Duration</div>
                  <div className="font-semibold">{duration} minutes</div>
                </div>

                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Session Type</div>
                  <div className="font-semibold capitalize">{sessionType.replace("_", " ")}</div>
                </div>

                <div className="pt-4 border-t">
                  <div className="flex items-center justify-between text-lg font-bold">
                    <span>Total Price</span>
                    <span className="text-orange-500">EGP {sessionPrice}</span>
                  </div>
                </div>

                <div className="pt-4 space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 mt-0.5 text-green-500" />
                    <span>Coach will confirm within 24 hours</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 mt-0.5 text-green-500" />
                    <span>Free cancellation up to 24 hours before</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 mt-0.5 text-green-500" />
                    <span>Payment on arrival</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
