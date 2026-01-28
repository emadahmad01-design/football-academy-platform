import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import DashboardLayout from '@/components/DashboardLayout';
import { trpc } from '@/lib/trpc';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/_core/hooks/useAuth';
import { Calendar, Clock, MapPin, User, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { EmptyState } from '../components/EmptyState';
import { toast } from 'sonner';
import { useState } from 'react';

export default function MyBookings() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState<number | null>(null);
  
  // Fetch user's private training bookings
  const { data: bookings = [], isLoading, refetch } = trpc.privateTraining.getMyBookings.useQuery();
  
  // Confirm booking mutation
  const confirmMutation = trpc.privateTraining.confirmBooking.useMutation({
    onSuccess: () => {
      toast.success(language === 'ar' ? 'تم تأكيد الحجز بنجاح' : 'Booking confirmed successfully');
      refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // Reject booking mutation
  const rejectMutation = trpc.privateTraining.rejectBooking.useMutation({
    onSuccess: () => {
      toast.success(language === 'ar' ? 'تم رفض الحجز' : 'Booking rejected');
      refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // Cancel booking mutation
  const cancelMutation = trpc.privateTraining.cancelBooking.useMutation({
    onSuccess: () => {
      toast.success(language === 'ar' ? 'تم إلغاء الحجز' : 'Booking cancelled');
      setCancelDialogOpen(false);
      setSelectedBookingId(null);
      refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleCancelClick = (bookingId: number) => {
    setSelectedBookingId(bookingId);
    setCancelDialogOpen(true);
  };

  const handleConfirmCancel = () => {
    if (selectedBookingId) {
      cancelMutation.mutate({ bookingId: selectedBookingId });
    }
  };
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <Badge className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" /> {language === 'ar' ? 'مؤكد' : 'Confirmed'}</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500"><AlertCircle className="h-3 w-3 mr-1" /> {language === 'ar' ? 'قيد الانتظار' : 'Pending'}</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-500"><XCircle className="h-3 w-3 mr-1" /> {language === 'ar' ? 'ملغي' : 'Cancelled'}</Badge>;
      case 'completed':
        return <Badge className="bg-blue-500"><CheckCircle className="h-3 w-3 mr-1" /> {language === 'ar' ? 'مكتمل' : 'Completed'}</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <>
      <DashboardLayout>
        <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Calendar className="h-8 w-8 text-cyan-500" />
            {language === 'ar' ? 'حجوزاتي' : 'My Bookings'}
          </h1>
          <p className="text-muted-foreground mt-1">
            {language === 'ar' ? 'عرض وإدارة جلسات التدريب الخاصة المحجوزة' : 'View and manage your private training session bookings'}
          </p>
        </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-20 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : bookings.length === 0 ? (
        <EmptyState
          icon="📅"
          title={language === 'ar' ? 'لا توجد حجوزات' : 'No Bookings Yet'}
          description={language === 'ar' ? 'ليس لديك أي جلسات تدريب خاصة محجوزة حالياً' : "You don't have any private training sessions booked yet"}
          action={{
            label: language === 'ar' ? 'احجز جلسة' : 'Book a Session',
            onClick: () => window.location.href = '/private-training'
          }}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {bookings.map((booking: any) => (
            <Card key={booking.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <User className="h-5 w-5 text-cyan-500" />
                      {booking.coachName || 'Unassigned Coach'}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {booking.playerName && `Player: ${booking.playerName}`}
                    </CardDescription>
                  </div>
                  {getStatusBadge(booking.status)}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>{new Date(booking.sessionDate).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>{booking.startTime} - {booking.endTime}</span>
                </div>
                {booking.locationName && (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{booking.locationName}</span>
                  </div>
                )}
                {booking.totalPrice && (
                  <div className="flex items-center gap-2 text-sm font-semibold text-cyan-600">
                    <span>{booking.totalPrice} {language === 'ar' ? 'ج.م' : 'EGP'}</span>
                  </div>
                )}
                {booking.notes && (
                  <p className="text-sm text-muted-foreground mt-2 pt-2 border-t">
                    {booking.notes}
                  </p>
                )}
                {booking.status === 'pending' && user && user.role && ['coach', 'admin'].includes(user.role) && (
                  <div className="flex gap-2 mt-4 pt-2 border-t">
                    <Button 
                      size="sm" 
                      className="flex-1 bg-green-600 hover:bg-green-700"
                      onClick={() => confirmMutation.mutate({ bookingId: booking.id })}
                      disabled={confirmMutation.isPending}
                    >
                      {confirmMutation.isPending ? '...' : (language === 'ar' ? 'تأكيد' : 'Accept')}
                    </Button>
                    <Button 
                      size="sm" 
                      variant="destructive" 
                      className="flex-1"
                      onClick={() => rejectMutation.mutate({ bookingId: booking.id })}
                      disabled={rejectMutation.isPending}
                    >
                      {rejectMutation.isPending ? '...' : (language === 'ar' ? 'رفض' : 'Reject')}
                    </Button>
                  </div>
                )}
                {booking.status === 'confirmed' && new Date(booking.sessionDate) > new Date() && user && user.role && ['coach', 'admin'].includes(user.role) && (
                  <Button 
                    variant="outline" 
                    className="w-full mt-4" 
                    size="sm"
                    onClick={() => handleCancelClick(booking.id)}
                  >
                    {language === 'ar' ? 'إلغاء الحجز' : 'Cancel Booking'}
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      </div>
    </DashboardLayout>

    {/* Cancel Confirmation Dialog */}
    <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {language === 'ar' ? 'تأكيد إلغاء الحجز' : 'Confirm Cancellation'}
          </DialogTitle>
          <DialogDescription>
            {language === 'ar' 
              ? 'هل أنت متأكد من رغبتك في إلغاء هذه الجلسة؟ لا يمكن التراجع عن هذا الإجراء.'
              : 'Are you sure you want to cancel this booking? This action cannot be undone.'}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <Button 
            variant="outline" 
            onClick={() => setCancelDialogOpen(false)}
          >
            {language === 'ar' ? 'إلغاء' : 'Cancel'}
          </Button>
          <Button 
            variant="destructive"
            onClick={handleConfirmCancel}
            disabled={cancelMutation.isPending}
          >
            {cancelMutation.isPending 
              ? (language === 'ar' ? 'جاري الإلغاء...' : 'Cancelling...') 
              : (language === 'ar' ? 'تأكيد الإلغاء' : 'Confirm Cancellation')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
}
