import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { api, ApiResponse } from '../lib/api';

interface AuthUser {
  id: string;
  name: string;
  email: string;
}

export function useAuth() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: user, isLoading } = useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const res = await api.get<ApiResponse<AuthUser>>('/auth/me');
      return res.data.data;
    },
    retry: false,
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await api.post('/auth/logout');
    },
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: ['me'] });
      router.push('/login');
    },
  });

  return {
    user,
    isLoading,
    logout: () => logoutMutation.mutate(),
  };
}
