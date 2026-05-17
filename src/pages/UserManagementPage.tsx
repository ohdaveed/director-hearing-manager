import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userService } from '@/services/userService';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Users2, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

type User = any; // Properly type later

const ROLE_COLORS: Record<string, string> = {
  'Super Admin': 'bg-warning/15 text-warning border-warning/30',
  Admin: 'bg-primary/15 text-primary border-primary/30',
  Inspector: 'bg-success/15 text-success border-success/30',
  'Program Manager': 'bg-accent/50 text-accent-foreground border-accent/30',
};

const ROLES = ['Admin', 'Inspector', 'Program Manager', 'Super Admin'] as const;

export default function UserManagementPage() {
  const queryClient = useQueryClient();
  const { data: users = [], isLoading: loading } = useQuery({
    queryKey: ['users'],
    queryFn: () => userService.getAll(),
  });

  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const updateRoleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string, role: string }) => 
      userService.updateRole(userId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Role updated successfully');
    },
    onError: (err: any) => {
      const msg = err.message || '';
      if (msg.toLowerCase().includes('forbidden') || msg.toLowerCase().includes('super admin')) {
        toast.error('Permission denied — only Super Admins can assign roles.');
      } else {
        toast.error('Failed to update role');
      }
    },
    onSettled: () => setUpdatingId(null)
  });

  const handleRoleChange = async (userId: string, role: typeof ROLES[number]) => {
    setUpdatingId(userId);
    updateRoleMutation.mutate({ userId, role });
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 py-8 max-w-4xl">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
          <Users2 className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">User Management</h1>
          <p className="text-sm text-muted-foreground">Assign and manage roles for all users</p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="grid grid-cols-[1fr_auto_auto] sm:grid-cols-[auto_1fr_auto_auto] items-center gap-4 px-4 py-3 border-b border-border bg-muted/40 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          <span className="hidden sm:block">Avatar</span>
          <span>User</span>
          <span>Current Role</span>
          <span>Assign Role</span>
        </div>

        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-4 border-b border-border last:border-0">
              <Skeleton className="w-9 h-9 rounded-full" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-28" />
              </div>
              <Skeleton className="h-6 w-24 rounded-full" />
              <Skeleton className="h-9 w-36 rounded-md" />
            </div>
          ))
        ) : users.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground text-sm">No users found.</div>
        ) : (
          users.map(user => {
            const initials = [user.firstName?.[0], user.lastName?.[0]].filter(Boolean).join('') ||
              user.email?.[0]?.toUpperCase() || '?';
            const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ') || '—';
            return (
              <div key={user.id} className="grid grid-cols-[1fr_auto_auto] sm:grid-cols-[auto_1fr_auto_auto] items-center gap-4 px-4 py-3.5 border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                <div className="hidden sm:flex w-9 h-9 rounded-full bg-primary/10 items-center justify-center text-primary font-semibold text-sm flex-shrink-0">
                  {initials}
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-sm text-foreground truncate">{fullName}</p>
                  <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                </div>
                <div className="flex items-center">
                  {user.role ? (
                    <Badge variant="outline" className={`text-xs font-medium whitespace-nowrap ${ROLE_COLORS[user.role] ?? 'bg-muted text-muted-foreground'}`}>
                      {user.role === 'Super Admin' && <ShieldCheck className="w-3 h-3 mr-1" />}
                      {user.role}
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-xs text-muted-foreground">No Role</Badge>
                  )}
                </div>
                <Select
                  value={user.role ?? ''}
                  onValueChange={v => handleRoleChange(user.id, v as typeof ROLES[number])}
                  disabled={updatingId === user.id}
                >
                  <SelectTrigger className="h-9 w-36 text-xs">
                    <SelectValue placeholder="Assign role..." />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLES.map(r => (
                      <SelectItem key={r} value={r} className="text-xs">{r}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            );
          })
        )}
      </div>

      <p className="text-xs text-muted-foreground mt-4 text-center">
        {users.length} user{users.length !== 1 ? 's' : ''} total
      </p>
    </div>
  );
}
