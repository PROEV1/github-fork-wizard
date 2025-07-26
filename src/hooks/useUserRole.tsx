import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export type UserRole = 'admin' | 'client' | 'engineer' | 'manager' | 'standard_office_user' | null;

export function useUserRole() {
  const { user } = useAuth();
  const [role, setRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserRole = async () => {
      if (!user?.id) {
        setRole(null);
        setLoading(false);
        return;
      }

      try {
        console.log('useUserRole: Fetching role for user ID:', user.id);
        const { data, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('user_id', user.id)
          .maybeSingle();

        console.log('useUserRole: Query result:', { data, error });

        if (error) {
          console.error('useUserRole: Database error:', error);
          throw error;
        }
        
        if (data) {
          console.log('useUserRole: Setting role to:', data.role);
          setRole(data.role as UserRole);
        } else {
          console.log('useUserRole: No profile found, setting role to null');
          setRole(null);
        }
      } catch (error) {
        console.error('Error fetching user role:', error);
        setRole(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUserRole();
  }, [user?.id]);

  return { role, loading };
}