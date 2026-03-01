'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { api, ApiResponse } from '../lib/api';

interface AuthUser {
  id: string;
  name: string;
  email: string;
}

export default function HomePage() {
  const router = useRouter();

  const { data: user, isLoading, isError } = useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const res = await api.get<ApiResponse<AuthUser>>('/auth/me');
      return res.data.data;
    },
    retry: false,
  });

  useEffect(() => {
    if (isLoading) return;
    if (user) {
      router.replace('/dashboard');
    } else {
      router.replace('/login');
    }
  }, [user, isLoading, isError, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-100">
      <p className="text-slate-400">Redirecting...</p>
    </div>
  );
}
