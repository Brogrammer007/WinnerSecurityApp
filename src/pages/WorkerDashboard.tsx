import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import * as store from '@/lib/localStore';
import { DashboardLayout } from '@/components/DashboardLayout';
import { ShiftBadge, StatusBadge } from '@/components/Badges';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Plus, Calendar } from 'lucide-react';
import type { Shift, ShiftType } from '@/types/database';
import { SHIFT_INFO } from '@/types/database';

export default function WorkerDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [date, setDate] = useState('');
  const [shiftType, setShiftType] = useState<ShiftType | ''>('');

  useEffect(() => {
    fetchShifts();
  }, [user]);

  function fetchShifts() {
    if (!user) return;

    const userShifts = store.getShiftsByUserId(user.id);
    const sorted = userShifts.sort((a, b) =>
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    setShifts(sorted);
    setLoading(false);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!date || !shiftType || !user) {
      toast({
        variant: 'destructive',
        title: 'Greška',
        description: 'Izaberite datum i smenu',
      });
      return;
    }

    setSubmitting(true);

    try {
      store.addShift(user.id, date, shiftType, 'pending');
      toast({
        title: 'Uspešno',
        description: 'Zahtev za smenu je poslat',
      });
      setDate('');
      setShiftType('');
      setShowForm(false);
      fetchShifts();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Greška',
        description: error.message,
      });
    }

    setSubmitting(false);
  }

  // Get today's date in YYYY-MM-DD format for min attribute
  const today = new Date().toISOString().split('T')[0];

  return (
    <DashboardLayout title="Moje smene">
      <div className="space-y-4">
        {/* Add shift button */}
        {!showForm && (
          <Button onClick={() => setShowForm(true)} className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            Dodaj smenu
          </Button>
        )}

        {/* Add shift form */}
        {showForm && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Nova smena</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="date">Datum</Label>
                    <Input
                      id="date"
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      min={today}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="shift">Smena</Label>
                    <Select value={shiftType} onValueChange={(v) => setShiftType(v as ShiftType)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Izaberite smenu" />
                      </SelectTrigger>
                      <SelectContent>
                        {(['1', '2', '3'] as ShiftType[]).map((type) => (
                          <SelectItem key={type} value={type}>
                            {SHIFT_INFO[type].label} ({SHIFT_INFO[type].time})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button type="submit" disabled={submitting}>
                    {submitting ? 'Slanje...' : 'Pošalji zahtev'}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                    Otkaži
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Shifts list */}
        <div className="space-y-2">
          <h2 className="text-sm font-medium text-muted-foreground">Vaše smene</h2>

          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Učitavanje...</div>
          ) : shifts.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Nemate zakazanih smena
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {shifts.map((shift) => (
                <Card key={shift.id}>
                  <CardContent className="py-3 px-4">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-3 flex-wrap">
                        <div className="flex items-center gap-1 text-sm">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>{new Date(shift.date).toLocaleDateString('sr-Latn-RS', {
                            weekday: 'short',
                            day: 'numeric',
                            month: 'short'
                          })}</span>
                        </div>
                        <ShiftBadge type={shift.shift_type as ShiftType} />
                      </div>
                      <StatusBadge status={shift.status} />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
