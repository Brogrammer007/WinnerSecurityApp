// Local Storage Service for WinnerSecurity
// Manages all data locally without external database

import type { User, Shift, Absence, UserRole, RequestStatus, ShiftType } from '@/types/database';

// Storage keys
const STORAGE_KEYS = {
  USERS: 'winner_security_users',
  SHIFTS: 'winner_security_shifts',
  ABSENCES: 'winner_security_absences',
  CURRENT_USER: 'winner_security_current_user',
};

// Generate UUID
function generateId(): string {
  return crypto.randomUUID();
}

// Get current timestamp
function now(): string {
  return new Date().toISOString();
}

// ========== USERS ==========

export function getUsers(): User[] {
  const data = localStorage.getItem(STORAGE_KEYS.USERS);
  if (!data) {
    // Initialize with admin user
    const admin: User = {
      id: generateId(),
      name: 'Administrator',
      role: 'admin',
      created_at: now(),
    };
    // Store admin with password
    const usersWithPassword = [{ ...admin, username: 'admin', password: 'admin123' }];
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(usersWithPassword));
    return [admin];
  }
  // Return users without password
  return JSON.parse(data).map(({ password, username, ...user }: any) => user as User);
}

export function getUsersWithCredentials(): Array<User & { username: string; password: string }> {
  const data = localStorage.getItem(STORAGE_KEYS.USERS);
  if (!data) {
    getUsers(); // Initialize
    return getUsersWithCredentials();
  }
  return JSON.parse(data);
}

export function getUserById(id: string): User | null {
  const users = getUsers();
  return users.find(u => u.id === id) || null;
}

export function getWorkers(): User[] {
  return getUsers().filter(u => u.role === 'worker');
}

export function addUser(username: string, password: string, name: string, role: UserRole): User {
  const users = getUsersWithCredentials();

  // Check if username exists
  if (users.some(u => u.username === username)) {
    throw new Error('Korisničko ime već postoji');
  }

  const newUser: User & { username: string; password: string } = {
    id: generateId(),
    name,
    role,
    created_at: now(),
    username,
    password,
  };

  users.push(newUser);
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));

  const { password: _, username: __, ...user } = newUser;
  return user;
}

// Add worker without credentials (just name)
export function addWorker(name: string): User {
  const users = getUsersWithCredentials();

  const newUser = {
    id: generateId(),
    name,
    role: 'worker' as UserRole,
    created_at: now(),
    username: '',
    password: '',
  };

  users.push(newUser);
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));

  const { password: _, username: __, ...user } = newUser;
  return user;
}

export function deleteUser(id: string): void {
  const users = getUsersWithCredentials();
  const filtered = users.filter(u => u.id !== id);
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(filtered));

  // Also delete user's shifts and absences
  const shifts = getShifts().filter(s => s.user_id !== id);
  localStorage.setItem(STORAGE_KEYS.SHIFTS, JSON.stringify(shifts));
}

export function updateUser(id: string, updates: Partial<Pick<User, 'name' | 'role'>>): User | null {
  const users = getUsersWithCredentials();
  const index = users.findIndex(u => u.id === id);
  if (index === -1) return null;

  users[index] = { ...users[index], ...updates };
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));

  const { password: _, username: __, ...user } = users[index];
  return user;
}

// ========== AUTHENTICATION ==========

export function authenticate(username: string, password: string): User | null {
  const users = getUsersWithCredentials();
  const user = users.find(u => u.username === username && u.password === password);
  if (!user) return null;

  const { password: _, username: __, ...userData } = user;
  return userData;
}

export function getCurrentUser(): User | null {
  const data = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
  if (!data) return null;
  return JSON.parse(data);
}

export function setCurrentUser(user: User | null): void {
  if (user) {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
  } else {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  }
}

// ========== SHIFTS ==========

export function getShifts(): Shift[] {
  const data = localStorage.getItem(STORAGE_KEYS.SHIFTS);
  return data ? JSON.parse(data) : [];
}

export function getShiftsWithUsers(): Array<Shift & { users: User }> {
  const shifts = getShifts();
  const users = getUsers();

  return shifts.map(shift => ({
    ...shift,
    users: users.find(u => u.id === shift.user_id)!,
  })).filter(s => s.users); // Filter out shifts with deleted users
}

export function getShiftsByUserId(userId: string): Shift[] {
  return getShifts().filter(s => s.user_id === userId);
}

export function getShiftById(id: string): Shift | null {
  return getShifts().find(s => s.id === id) || null;
}

export function getPendingShifts(): Array<Shift & { users: User }> {
  return getShiftsWithUsers().filter(s => s.status === 'pending');
}

export function addShift(userId: string, date: string, shiftType: ShiftType, status: RequestStatus = 'pending'): Shift {
  const shifts = getShifts();

  // Check if user already has shift for this date
  if (shifts.some(s => s.user_id === userId && s.date === date)) {
    throw new Error('Radnik već ima smenu za taj datum');
  }

  const newShift: Shift = {
    id: generateId(),
    user_id: userId,
    date,
    shift_type: shiftType,
    status,
    created_at: now(),
  };

  shifts.push(newShift);
  localStorage.setItem(STORAGE_KEYS.SHIFTS, JSON.stringify(shifts));
  return newShift;
}

export function updateShift(id: string, updates: Partial<Pick<Shift, 'status' | 'shift_type' | 'date'>>): Shift | null {
  const shifts = getShifts();
  const index = shifts.findIndex(s => s.id === id);
  if (index === -1) return null;

  shifts[index] = { ...shifts[index], ...updates };
  localStorage.setItem(STORAGE_KEYS.SHIFTS, JSON.stringify(shifts));
  return shifts[index];
}

export function deleteShift(id: string): void {
  const shifts = getShifts().filter(s => s.id !== id);
  localStorage.setItem(STORAGE_KEYS.SHIFTS, JSON.stringify(shifts));

  // Also delete related absences
  const absences = getAbsences().filter(a => a.shift_id !== id);
  localStorage.setItem(STORAGE_KEYS.ABSENCES, JSON.stringify(absences));
}

// ========== ABSENCES ==========

export function getAbsences(): Absence[] {
  const data = localStorage.getItem(STORAGE_KEYS.ABSENCES);
  return data ? JSON.parse(data) : [];
}

export function getAbsencesByShiftId(shiftId: string): Absence[] {
  return getAbsences().filter(a => a.shift_id === shiftId);
}

export function addAbsence(shiftId: string, reason: string, replacementUserId?: string): Absence {
  const absences = getAbsences();

  const newAbsence: Absence = {
    id: generateId(),
    shift_id: shiftId,
    reason,
    replacement_user_id: replacementUserId || null,
    status: 'pending',
    created_at: now(),
  };

  absences.push(newAbsence);
  localStorage.setItem(STORAGE_KEYS.ABSENCES, JSON.stringify(absences));
  return newAbsence;
}

export function updateAbsence(id: string, updates: Partial<Pick<Absence, 'status' | 'reason' | 'replacement_user_id'>>): Absence | null {
  const absences = getAbsences();
  const index = absences.findIndex(a => a.id === id);
  if (index === -1) return null;

  absences[index] = { ...absences[index], ...updates };
  localStorage.setItem(STORAGE_KEYS.ABSENCES, JSON.stringify(absences));
  return absences[index];
}

// ========== UTILITY ==========

export function clearAllData(): void {
  localStorage.removeItem(STORAGE_KEYS.USERS);
  localStorage.removeItem(STORAGE_KEYS.SHIFTS);
  localStorage.removeItem(STORAGE_KEYS.ABSENCES);
  localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
}
