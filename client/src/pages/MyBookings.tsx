import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/lib/trpc';
import { useLanguage } from '@/contexts/LanguageContext';
import { Calendar, Clock, MapPin, User, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { EmptyState } from '../components/EmptyState';

export default function MyBookings() {
  const { language } = useLanguage();
  
  // Fetch user's private training bookings
  const { data: bookings = [], isLoading } = trpc.privateTraining.getMyBookings.useQuery();
  
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
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">
          {language === 'ar' ? 'حجوزاتي' : 'My Bookings'}
        </h1>
        <p className="text-muted-foreground">
          {language === 'ar' ? 'عرض وإدارة جلسات التدريب الخاصة المحجوزة' : 'View and manage your private training session bookings'}
        </p>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
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
                  <CardTitle className="text-lg">{booking.coachName}</CardTitle>
                  {getStatusBadge(booking.status)}
                </div>
                <CardDescription>
                  {booking.sessionType === 'individual' 
                    ? (language === 'ar' ? 'جلسة فردية' : 'Individual Session')
                    : (language === 'ar' ? 'جلسة جماعية' : 'Group Session')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>{new Date(booking.date).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>{booking.timeSlot}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{booking.location || (language === 'ar' ? 'الأكاديمية' : 'Academy')}</span>
                </div>
                {booking.notes && (
                  <p className="text-sm text-muted-foreground mt-2 pt-2 border-t">
                    {booking.notes}
                  </p>
                )}
                {booking.status === 'confirmed' && new Date(booking.date) > new Date() && (
                  <Button variant="outline" className="w-full mt-4" size="sm">
                    {language === 'ar' ? 'إلغاء الحجز' : 'Cancel Booking'}
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
