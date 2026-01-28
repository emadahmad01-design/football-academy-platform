import { useState } from "react";
import { useAuth } from '@/_core/hooks/useAuth';
import { useLanguage } from "@/contexts/LanguageContext";
import DashboardLayout from "@/components/DashboardLayout";
import { DashboardLayoutSkeleton } from "@/components/DashboardLayoutSkeleton";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Clock, Plus, Calendar, Loader2, Trash2, Users } from "lucide-react";

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAYS_OF_WEEK_AR = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
const TIME_SLOTS = ['06:00', '07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00'];

export default function CoachAvailabilityManagement() {
  const { user, loading: authLoading } = useAuth();
  const { language } = useLanguage();
  const isRTL = language === 'ar';
  const isAdmin = user?.role === 'admin';

  const [selectedCoachId, setSelectedCoachId] = useState<number | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState<{
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    pricePerSession: number;
    isAvailable: boolean;
  }>({
    dayOfWeek: 0,
    startTime: '09:00',
    endTime: '17:00',
    pricePerSession: 200,
    isAvailable: true,
  });

  const utils = trpc.useUtils();
  const { data: coaches, isLoading: coachesLoading } = trpc.privateTraining.getCoaches.useQuery(undefined, { enabled: isAdmin });
  
  // Get schedule slots for the selected coach (admin) or current user (coach)
  const targetCoachId = isAdmin && selectedCoachId ? selectedCoachId : user?.id;
  const { data: slotsFromCoach, isLoading: slotsLoadingCoach } = trpc.privateTraining.getMySlots.useQuery(undefined, {
    enabled: !isAdmin && !!user?.id
  });
  const { data: slotsFromAdmin, isLoading: slotsLoadingAdmin } = trpc.privateTraining.getCoachSlotsAdmin.useQuery(
    { coachId: selectedCoachId! },
    { enabled: isAdmin && !!selectedCoachId }
  );
  
  const slots = isAdmin ? slotsFromAdmin : slotsFromCoach;
  const slotsLoading = isAdmin ? slotsLoadingAdmin : slotsLoadingCoach;

  const addSlot = trpc.privateTraining.addSlot.useMutation({
    onSuccess: async () => {
      toast.success(isRTL ? 'تم إضافة الموعد بنجاح' : 'Slot added successfully');
      await utils.privateTraining.getMySlots.refetch();
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => toast.error(error.message),
  });

  const addSlotForCoach = trpc.privateTraining.addSlotForCoach.useMutation({
    onSuccess: async () => {
      toast.success(isRTL ? 'تم إضافة الموعد بنجاح' : 'Slot added successfully');
      await utils.privateTraining.getCoachSlotsAdmin.refetch();
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => toast.error(error.message),
  });

  const deleteSlot = trpc.privateTraining.deleteSlot.useMutation({
    onSuccess: async () => {
      toast.success(isRTL ? 'تم حذف الموعد' : 'Slot deleted');
      if (isAdmin) {
        await utils.privateTraining.getCoachSlotsAdmin.refetch();
      } else {
        await utils.privateTraining.getMySlots.refetch();
      }
    },
    onError: (error: any) => toast.error(error.message),
  });

  const resetForm = () => {
    setFormData({ dayOfWeek: 0, startTime: '09:00', endTime: '17:00', pricePerSession: 200, isAvailable: true });
  };

  const handleSave = () => {
    if (isAdmin && selectedCoachId) {
      addSlotForCoach.mutate({
        coachId: selectedCoachId,
        dayOfWeek: formData.dayOfWeek,
        startTime: formData.startTime,
        endTime: formData.endTime,
        pricePerSession: formData.pricePerSession,
      });
    } else if (!isAdmin) {
      addSlot.mutate({
        dayOfWeek: formData.dayOfWeek,
        startTime: formData.startTime,
        endTime: formData.endTime,
        pricePerSession: formData.pricePerSession,
      });
    } else {
      toast.error(isRTL ? 'اختر مدربًا' : 'Please select a coach');
    }
  };

  const handleDelete = (slotId: number) => {
    if (confirm(isRTL ? 'هل أنت متأكد من الحذف؟' : 'Are you sure you want to delete this slot?')) {
      deleteSlot.mutate({ slotId });
    }
  };

  const groupedByDay = DAYS_OF_WEEK.map((day, index) => ({
    day,
    dayAr: DAYS_OF_WEEK_AR[index],
    dayIndex: index,
    slots: (slots || []).filter((s: any) => s.dayOfWeek === index),
  }));

  if (authLoading) return <DashboardLayoutSkeleton />;

  return (
    <DashboardLayout>
      <div className={`container mx-auto p-6 \${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Clock className="w-8 h-8" />
              {isRTL ? 'إدارة التوفر' : 'Availability Management'}
            </h1>
            <p className="text-muted-foreground mt-1">
              {isRTL ? (isAdmin ? 'إدارة أوقات توفر المدربين' : 'حدد أوقات توفرك للتدريب') : (isAdmin ? 'Manage coach availability schedules' : 'Set your availability for training sessions')}
            </p>
          </div>
          <Button onClick={() => setIsDialogOpen(true)} className="gap-2" disabled={isAdmin && !selectedCoachId}>
            <Plus className="w-4 h-4" />
            {isRTL ? 'إضافة توفر' : 'Add Availability'}
          </Button>
        </div>

        {/* Coach Selection for Admins */}
        {isAdmin && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                {isRTL ? 'اختر المدرب' : 'Select Coach'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={selectedCoachId?.toString() || ''} onValueChange={(v) => setSelectedCoachId(parseInt(v))}>
                <SelectTrigger>
                  <SelectValue placeholder={isRTL ? 'اختر مدربًا' : 'Select a coach'} />
                </SelectTrigger>
                <SelectContent>
                  {coaches?.map((coach) => (
                    <SelectItem key={coach.userId} value={coach.userId.toString()}>
                      {coach.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        )}

        {slotsLoading ? (
          <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin" /></div>
        ) : (
          <div className="space-y-4">
            {groupedByDay.map(({ day, dayAr, dayIndex, slots }) => (
              <Card key={dayIndex}>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Calendar className="w-5 h-5" />
                    {isRTL ? dayAr : day}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {slots.length === 0 ? (
                    <p className="text-muted-foreground text-sm">{isRTL ? 'لا يوجد توفر محدد' : 'No availability set'}</p>
                  ) : (
                    <div className="space-y-2">
                      {slots.map((slot) => (
                        <div key={slot.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                          <div className="flex items-center gap-3">
                            <Badge variant={slot.isAvailable ? 'default' : 'secondary'}>
                              {slot.startTime} - {slot.endTime}
                            </Badge>
                            {slot.pricePerSession && (
                              <Badge variant="outline" className="bg-green-50 text-green-700 dark:bg-green-900 dark:text-green-300">
                                {slot.pricePerSession} {isRTL ? 'ج.م' : 'EGP'}
                              </Badge>
                            )}
                          </div>
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(slot.id)}>
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                {isRTL ? 'إضافة توفر جديد' : 'Add New Availability'}
              </DialogTitle>
              <DialogDescription>
                {isRTL ? 'حدد أوقات توفرك للتدريب' : 'Set your available times for training'}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>{isRTL ? 'اليوم' : 'Day'}</Label>
                <Select value={String(formData.dayOfWeek)} onValueChange={(v) => setFormData({ ...formData, dayOfWeek: parseInt(v) })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {DAYS_OF_WEEK.map((day, i) => (
                      <SelectItem key={i} value={String(i)}>{isRTL ? DAYS_OF_WEEK_AR[i] : day}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{isRTL ? 'وقت البداية' : 'Start Time'}</Label>
                  <Select value={formData.startTime} onValueChange={(v) => setFormData({ ...formData, startTime: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{TIME_SLOTS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{isRTL ? 'وقت النهاية' : 'End Time'}</Label>
                  <Select value={formData.endTime} onValueChange={(v) => setFormData({ ...formData, endTime: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{TIME_SLOTS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>{isRTL ? 'السعر (ج.م)' : 'Price (EGP)'}</Label>
                <Input
                  type="number"
                  value={formData.pricePerSession}
                  onChange={(e) => setFormData({ ...formData, pricePerSession: parseInt(e.target.value) || 0 })}
                  placeholder="200"
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>{isRTL ? 'إلغاء' : 'Cancel'}</Button>
              <Button onClick={handleSave} disabled={addSlot.isPending || addSlotForCoach.isPending}>
                {(addSlot.isPending || addSlotForCoach.isPending) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {isRTL ? 'إضافة' : 'Add'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
