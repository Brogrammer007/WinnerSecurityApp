import { useState, useEffect } from 'react';
import * as store from '@/lib/localStore';
import { DashboardLayout } from '@/components/DashboardLayout';
import { ShiftBadge, StatusBadge } from '@/components/Badges';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Calendar, Clock, Users, Plus, Trash2, UserPlus, ChevronLeft, ChevronRight, X } from 'lucide-react';
import type { Shift, ShiftType, User } from '@/types/database';
import { SHIFT_INFO } from '@/types/database';

interface ShiftWithUser extends Shift {
  users: User;
}

export default function AdminDashboard() {
  const { toast } = useToast();
  const [allShifts, setAllShifts] = useState<ShiftWithUser[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Calendar state
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedDateShifts, setSelectedDateShifts] = useState<ShiftWithUser[]>([]);

  // Add shift dialog state
  const [shiftDialogOpen, setShiftDialogOpen] = useState(false);
  const [newShiftType, setNewShiftType] = useState<ShiftType | ''>('');
  const [newShiftUserId, setNewShiftUserId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Add worker dialog state
  const [workerDialogOpen, setWorkerDialogOpen] = useState(false);
  const [newWorkerName, setNewWorkerName] = useState('');

  // Delete worker confirmation state
  const [deleteWorkerDialogOpen, setDeleteWorkerDialogOpen] = useState(false);
  const [workerToDelete, setWorkerToDelete] = useState<User | null>(null);

  // Delete shift confirmation state
  const [deleteShiftDialogOpen, setDeleteShiftDialogOpen] = useState(false);
  const [shiftToDelete, setShiftToDelete] = useState<ShiftWithUser | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedDate && shiftDialogOpen) {
      updateSelectedDateShifts();
    }
  }, [allShifts, selectedDate]);

  function updateSelectedDateShifts() {
    if (selectedDate) {
      setSelectedDateShifts(getShiftsForDate(selectedDate));
    }
  }

  function fetchData() {
    setLoading(true);
    const shiftsWithUsers = store.getShiftsWithUsers();
    const all = [...shiftsWithUsers].sort((a, b) =>
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    const allUsers = store.getWorkers();
    setAllShifts(all);
    setUsers(allUsers);
    setLoading(false);
  }

  // Calendar helpers
  function getDaysInMonth(date: Date): Date[] {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days: Date[] = [];

    // Add days from previous month to start on Monday
    const startDayOfWeek = firstDay.getDay() || 7;
    for (let i = startDayOfWeek - 1; i > 0; i--) {
      days.push(new Date(year, month, 1 - i));
    }

    // Add days of current month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i));
    }

    // Add days from next month to complete the grid
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      days.push(new Date(year, month + 1, i));
    }

    return days;
  }

  function formatDateKey(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  function getShiftsForDate(date: string): ShiftWithUser[] {
    return allShifts.filter(s => s.date === date);
  }

  function isToday(date: Date): boolean {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  }

  function isCurrentMonth(date: Date): boolean {
    return date.getMonth() === currentMonth.getMonth();
  }

  function handleDateClick(date: Date) {
    const dateKey = formatDateKey(date);
    setSelectedDate(dateKey);
    setSelectedDateShifts(getShiftsForDate(dateKey));
    if (users.length > 0) {
      setShiftDialogOpen(true);
    }
  }

  function handleAddShift(e: React.FormEvent) {
    e.preventDefault();

    if (!selectedDate || !newShiftType || !newShiftUserId) {
      toast({
        variant: 'destructive',
        title: 'Greška',
        description: 'Popunite sva polja',
      });
      return;
    }

    setSubmitting(true);

    try {
      store.addShift(newShiftUserId, selectedDate, newShiftType, 'approved');
      toast({
        title: 'Uspešno',
        description: 'Smena je dodeljena',
      });
      setNewShiftType('');
      setNewShiftUserId('');
      // Don't close dialog, just refresh data so user can see added shift
      fetchData();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Greška',
        description: error.message,
      });
    }

    setSubmitting(false);
  }

  function handleAddWorker(e: React.FormEvent) {
    e.preventDefault();

    if (!newWorkerName.trim()) {
      toast({
        variant: 'destructive',
        title: 'Greška',
        description: 'Unesite ime radnika',
      });
      return;
    }

    setSubmitting(true);

    try {
      store.addWorker(newWorkerName.trim());
      toast({
        title: 'Uspešno',
        description: 'Radnik je dodat',
      });
      setNewWorkerName('');
      setWorkerDialogOpen(false);
      fetchData();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Greška',
        description: error.message,
      });
    }

    setSubmitting(false);
  }

  function openDeleteWorkerDialog(user: User) {
    setWorkerToDelete(user);
    setDeleteWorkerDialogOpen(true);
  }

  function handleDeleteWorker() {
    if (!workerToDelete) return;

    try {
      store.deleteUser(workerToDelete.id);
      toast({
        title: 'Uspešno',
        description: 'Radnik je obrisan',
      });
      setDeleteWorkerDialogOpen(false);
      setWorkerToDelete(null);
      fetchData();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Greška',
        description: error.message,
      });
    }
  }

  function openDeleteShiftDialog(shift: ShiftWithUser) {
    setShiftToDelete(shift);
    setDeleteShiftDialogOpen(true);
  }

  function handleDeleteShift() {
    if (!shiftToDelete) return;

    try {
      store.deleteShift(shiftToDelete.id);
      toast({
        title: 'Uspešno',
        description: 'Smena je obrisana',
      });
      setDeleteShiftDialogOpen(false);
      setShiftToDelete(null);
      fetchData();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Greška',
        description: error.message,
      });
    }
  }

  // Calculate hours per worker
  const hoursPerWorker = users.map((user) => {
    const approvedShifts = allShifts.filter(
      (s) => s.user_id === user.id && s.status === 'approved'
    );
    return {
      user,
      shiftCount: approvedShifts.length,
      hours: approvedShifts.length * 8,
    };
  }).sort((a, b) => b.hours - a.hours);

  const calendarDays = getDaysInMonth(currentMonth);
  const weekDays = ['Pon', 'Uto', 'Sre', 'Čet', 'Pet', 'Sub', 'Ned'];

  return (
    <DashboardLayout title="Admin Panel">
      <Tabs defaultValue="calendar" className="space-y-4">
        <TabsList className="w-full grid grid-cols-3">
          <TabsTrigger value="calendar" className="text-xs sm:text-sm">
            Kalendar
          </TabsTrigger>
          <TabsTrigger value="hours" className="text-xs sm:text-sm">
            Sati
          </TabsTrigger>
          <TabsTrigger value="workers" className="text-xs sm:text-sm">
            Radnici
          </TabsTrigger>
        </TabsList>

        {/* Calendar view */}
        <TabsContent value="calendar" className="space-y-4">
          {users.length === 0 && (
            <Card>
              <CardContent className="py-4 text-center text-muted-foreground">
                Prvo dodajte radnike u tabu "Radnici"
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <CardTitle className="text-base">
                  {currentMonth.toLocaleDateString('sr-Latn-RS', { month: 'long', year: 'numeric' })}
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Week days header */}
              <div className="grid grid-cols-7 gap-1 mb-1">
                {weekDays.map((day) => (
                  <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar grid */}
              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((date, index) => {
                  const dateKey = formatDateKey(date);
                  const dayShifts = getShiftsForDate(dateKey);
                  const isCurrentMonthDay = isCurrentMonth(date);
                  const isTodayDay = isToday(date);

                  return (
                    <div
                      key={index}
                      onClick={() => isCurrentMonthDay && users.length > 0 && handleDateClick(date)}
                      className={`
                        min-h-[70px] p-1 border rounded-md cursor-pointer transition-colors
                        ${isCurrentMonthDay ? 'bg-card hover:bg-accent' : 'bg-muted/30 opacity-50'}
                        ${isTodayDay ? 'border-primary border-2' : 'border-border'}
                        ${users.length === 0 ? 'cursor-not-allowed' : ''}
                      `}
                    >
                      <div className={`text-xs font-medium mb-1 ${isTodayDay ? 'text-primary' : ''}`}>
                        {date.getDate()}
                      </div>
                      <div className="space-y-0.5">
                        {dayShifts.map((shift) => (
                          <div
                            key={shift.id}
                            className={`text-[10px] px-1 py-0.5 rounded truncate ${shift.shift_type === '1' ? 'bg-blue-500/20 text-blue-400' :
                                shift.shift_type === '2' ? 'bg-orange-500/20 text-orange-400' :
                                  'bg-purple-500/20 text-purple-400'
                              }`}
                            title={`${shift.users?.name} - ${SHIFT_INFO[shift.shift_type as ShiftType].label}`}
                          >
                            {shift.users?.name?.split(' ')[0]}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="flex gap-4 mt-4 justify-center text-xs">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded bg-blue-500/20"></div>
                  <span>1. smena</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded bg-orange-500/20"></div>
                  <span>2. smena</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded bg-purple-500/20"></div>
                  <span>3. smena</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Add/Manage Shift Dialog */}
          <Dialog open={shiftDialogOpen} onOpenChange={setShiftDialogOpen}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  Upravljanje smenama za {selectedDate && new Date(selectedDate).toLocaleDateString('sr-Latn-RS', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long'
                  })}
                </DialogTitle>
              </DialogHeader>

              {/* List of existing shifts for the day */}
              {selectedDateShifts.length > 0 && (
                <div className="mb-4 space-y-2">
                  <Label>Zakazane smene</Label>
                  <div className="space-y-2 border rounded-md p-2 max-h-[150px] overflow-y-auto">
                    {selectedDateShifts.map((shift) => (
                      <div key={shift.id} className="flex items-center justify-between bg-muted/50 p-2 rounded text-sm">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{shift.users?.name}</span>
                          <ShiftBadge type={shift.shift_type as ShiftType} />
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                          onClick={() => openDeleteShiftDialog(shift)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Add new shift form */}
              <form onSubmit={handleAddShift} className="space-y-4">
                <Label>Dodaj novu smenu</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="worker" className="text-xs">Radnik</Label>
                    <Select value={newShiftUserId} onValueChange={setNewShiftUserId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Izaberite" />
                      </SelectTrigger>
                      <SelectContent>
                        {users.map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="shift" className="text-xs">Smena</Label>
                    <Select value={newShiftType} onValueChange={(v) => setNewShiftType(v as ShiftType)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Izaberite" />
                      </SelectTrigger>
                      <SelectContent>
                        {(['1', '2', '3'] as ShiftType[]).map((type) => (
                          <SelectItem key={type} value={type}>
                            {SHIFT_INFO[type].label.split(' ')[0]} ({SHIFT_INFO[type].time})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button type="submit" disabled={submitting} className="flex-1">
                    {submitting ? 'Dodavanje...' : 'Dodeli smenu'}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setShiftDialogOpen(false)}>
                    Zatvori
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          {/* Delete shift confirmation */}
          <Dialog open={deleteShiftDialogOpen} onOpenChange={setDeleteShiftDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Obriši smenu</DialogTitle>
              </DialogHeader>
              <div className="py-2">
                Da li ste sigurni da želite da obrišete smenu za radnika <strong>{shiftToDelete?.users?.name}</strong>?
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setDeleteShiftDialogOpen(false)}>
                  Otkaži
                </Button>
                <Button variant="destructive" onClick={handleDeleteShift}>
                  Obriši
                </Button>
              </div>
            </DialogContent>
          </Dialog>

        </TabsContent>

        {/* Hours tracking */}
        <TabsContent value="hours">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Evidencija sati (odobrene smene)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-4 text-muted-foreground">Učitavanje...</div>
              ) : hoursPerWorker.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">
                  Nema radnika
                </div>
              ) : (
                <div className="space-y-3">
                  {hoursPerWorker.map(({ user, shiftCount, hours }) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between py-2 border-b border-border last:border-0"
                    >
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{user.name}</span>
                      </div>
                      <div className="text-right text-sm">
                        <div className="font-medium">{hours} sati</div>
                        <div className="text-muted-foreground">{shiftCount} smena</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Workers management */}
        <TabsContent value="workers" className="space-y-4">
          {/* Add worker button */}
          <Dialog open={workerDialogOpen} onOpenChange={setWorkerDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto">
                <UserPlus className="h-4 w-4 mr-2" />
                Dodaj radnika
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Dodaj novog radnika</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddWorker} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="workerName">Ime i prezime</Label>
                  <Input
                    id="workerName"
                    type="text"
                    value={newWorkerName}
                    onChange={(e) => setNewWorkerName(e.target.value)}
                    placeholder="Marko Marković"
                    required
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <Button type="submit" disabled={submitting} className="flex-1">
                    {submitting ? 'Dodavanje...' : 'Dodaj radnika'}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setWorkerDialogOpen(false)}>
                    Otkaži
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          {/* Delete worker confirmation dialog */}
          <Dialog open={deleteWorkerDialogOpen} onOpenChange={setDeleteWorkerDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Potvrda brisanja</DialogTitle>
              </DialogHeader>
              <div className="py-4">
                <p>Da li ste sigurni da želite da obrišete radnika <strong>"{workerToDelete?.name}"</strong>?</p>
                <p className="text-sm text-muted-foreground mt-2">Sve njegove smene će takođe biti obrisane.</p>
              </div>
              <div className="flex gap-2">
                <Button variant="destructive" onClick={handleDeleteWorker} className="flex-1">
                  Da, obriši
                </Button>
                <Button variant="outline" onClick={() => setDeleteWorkerDialogOpen(false)} className="flex-1">
                  Otkaži
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Workers list */}
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Učitavanje...</div>
          ) : users.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Nema radnika. Dodajte prvog radnika klikom na dugme iznad.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {users.map((user) => (
                <Card key={user.id}>
                  <CardContent className="py-3 px-4">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{user.name}</span>
                      </div>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => openDeleteWorkerDialog(user)}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Obriši
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}
