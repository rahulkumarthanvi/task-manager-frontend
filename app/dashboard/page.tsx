'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, ApiResponse } from '../../lib/api';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../../components/ui/dialog';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '../../components/ui/input';

const taskSchema = z.object({
  projectName: z.string().min(1),
  taskTitle: z.string().min(1),
  taskDetails: z.string().optional(),
  priority: z.enum(['High', 'Medium', 'Low']),
  dueDate: z.string().optional(),
  estTime: z.string().optional(),
  loggedTime: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(['Pending', 'In Progress', 'Blocked', 'Completed']),
});

type TaskFormValues = z.infer<typeof taskSchema>;
type CreateTaskPayload = Omit<TaskFormValues, 'projectName' | 'taskTitle'> & {
  projectName: string;
  taskTitle: string;
};

interface Task {
  _id: string;
  taskId: string;
  projectName: string;
  taskTitle: string;
  taskDetails?: string;
  priority: 'High' | 'Medium' | 'Low';
  status: 'Pending' | 'In Progress' | 'Blocked' | 'Completed';
  dueDate?: string;
  estTime?: string;
  loggedTime?: string;
  notes?: string;
  assignedDate?: string;
}

interface TaskStats {
  incompleteCount: number;
  completedCount: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, isLoading: authLoading, logout } = useAuth();

  const {
    data: tasks,
    isLoading: tasksLoading,
    refetch,
  } = useQuery<Task[]>({
    queryKey: ['tasks'],
    queryFn: async () => {
      const res = await api.get<ApiResponse<Task[]>>('/tasks');
      return res.data.data;
    },
  });

  const { data: stats } = useQuery<TaskStats>({
    queryKey: ['tasks', 'stats'],
    queryFn: async () => {
      const res = await api.get<ApiResponse<TaskStats>>('/tasks/stats');
      return res.data.data;
    },
  });

  const { data: projectSuggestions } = useQuery<string[]>({
    queryKey: ['projects'],
    queryFn: async () => {
      const res = await api.get<ApiResponse<string[]>>('/projects');
      return res.data.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (payload: CreateTaskPayload) => {
      const res = await api.post<ApiResponse<Task>>('/tasks', payload);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['tasks', 'stats'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (params: { id: string; data: Partial<TaskFormValues> }) => {
      const res = await api.patch<ApiResponse<Task>>(`/tasks/${params.id}`, params.data);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['tasks', 'stats'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete<ApiResponse<null>>(`/tasks/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['tasks', 'stats'] });
    },
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login');
    }
  }, [authLoading, user, router]);

  const projectOptions = useMemo(() => {
    const fromTasks = (tasks || []).map((task) => task.projectName);
    const fromProjects = projectSuggestions || [];
    return Array.from(new Set([...fromTasks, ...fromProjects])).sort();
  }, [tasks, projectSuggestions]);

  const statusBadgeVariant = (status: Task['status']) => {
    switch (status) {
      case 'Pending':
        return 'gray' as const;
      case 'In Progress':
        return 'blue' as const;
      case 'Blocked':
        return 'orange' as const;
      case 'Completed':
        return 'green' as const;
    }
  };

  const priorityBadgeVariant = (priority: Task['priority']) => {
    switch (priority) {
      case 'High':
        return 'red' as const;
      case 'Medium':
        return 'yellow' as const;
      case 'Low':
        return 'green' as const;
    }
  };

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      priority: 'Medium',
      status: 'Pending',
    },
  });

  const onCreate = (values: TaskFormValues) => {
    const optional = (value?: string) => {
      const trimmed = value?.trim();
      return trimmed ? trimmed : undefined;
    };

    const payload: CreateTaskPayload = {
      projectName: values.projectName.trim(),
      taskTitle: values.taskTitle.trim(),
      taskDetails: optional(values.taskDetails),
      priority: values.priority,
      dueDate: optional(values.dueDate),
      estTime: optional(values.estTime),
      loggedTime: optional(values.loggedTime),
      notes: optional(values.notes),
      status: values.status,
    };

    createMutation.mutate(payload, {
      onSuccess: () => {
        reset();
        refetch();
      },
    });
  };

  if (authLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-slate-50">
      <header className="border-b border-slate-800 bg-slate-900/80 px-6 py-4 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm text-slate-400">Welcome,</p>
            <p className="text-lg font-semibold">{user.name}</p>
          </div>
          <div className="flex items-center gap-4">
            {stats && (
              <div className="flex items-center gap-3 text-xs text-slate-300">
                <span>
                  Incomplete:{' '}
                  <span className="font-semibold text-yellow-300">
                    {stats.incompleteCount}
                  </span>
                </span>
                <span>
                  Completed:{' '}
                  <span className="font-semibold text-emerald-300">
                    {stats.completedCount}
                  </span>
                </span>
              </div>
            )}
            <Button
              variant="outline"
              className="border-slate-700 bg-slate-900 text-slate-100 hover:bg-slate-800"
              onClick={() => logout()}
            >
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-4 px-6 py-6">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Task Board</h2>
          <Dialog>
            <DialogTrigger asChild>
              <Button className="bg-primary text-primary-foreground shadow hover:bg-primary/90">
                + Add Task
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Task</DialogTitle>
              </DialogHeader>
              <form
                className="mt-4 space-y-3"
                onSubmit={handleSubmit(onCreate)}
              >
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Project Name
                  </label>
                  <Input
                    placeholder="Backend API"
                    list="project-name-suggestions"
                    {...register('projectName')}
                  />
                  <datalist id="project-name-suggestions">
                    {projectOptions.map((project) => (
                      <option key={project} value={project} />
                    ))}
                  </datalist>
                  {errors.projectName && (
                    <p className="mt-1 text-xs text-red-500">
                      {errors.projectName.message}
                    </p>
                  )}
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Task Title
                  </label>
                  <Input placeholder="Implement auth" {...register('taskTitle')} />
                  {errors.taskTitle && (
                    <p className="mt-1 text-xs text-red-500">
                      {errors.taskTitle.message}
                    </p>
                  )}
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Task Details
                  </label>
                  <Input
                    placeholder="Short description"
                    {...register('taskDetails')}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-sm font-medium">
                      Priority
                    </label>
                    <select
                      className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                      {...register('priority')}
                    >
                      <option value="High">High</option>
                      <option value="Medium">Medium</option>
                      <option value="Low">Low</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">
                      Status
                    </label>
                    <select
                      className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                      {...register('status')}
                    >
                      <option value="Pending">Pending</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Blocked">Blocked</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-sm font-medium">
                      Due Date
                    </label>
                    <Input type="date" {...register('dueDate')} />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">
                      Estimated Time
                    </label>
                    <Input placeholder="e.g. 4h" {...register('estTime')} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-sm font-medium">
                      Logged Time
                    </label>
                    <Input placeholder="e.g. 2h" {...register('loggedTime')} />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">
                      Notes
                    </label>
                    <Input placeholder="Additional notes" {...register('notes')} />
                  </div>
                </div>
                <Button
                  type="submit"
                  className="mt-2 w-full"
                  disabled={createMutation.isPending}
                >
                  {createMutation.isPending ? 'Creating...' : 'Create Task'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-slate-800 bg-slate-900/60 px-4 py-3 text-sm">
          <span className="text-slate-300">Filters:</span>
          <select
            className="h-9 rounded-md border border-slate-700 bg-slate-900 px-3 text-xs text-slate-100"
            onChange={async (e) => {
              const value = e.target.value;
              const params = new URLSearchParams();
              if (value) params.set('status', value);
              const res = await api.get<ApiResponse<Task[]>>(
                `/tasks?${params.toString()}`,
              );
              queryClient.setQueryData(['tasks'], res.data.data);
            }}
          >
            <option value="">Status: Incomplete (default)</option>
            <option value="Pending">Pending</option>
            <option value="In Progress">In Progress</option>
            <option value="Blocked">Blocked</option>
            <option value="Completed">Completed</option>
          </select>
          <select
            className="h-9 rounded-md border border-slate-700 bg-slate-900 px-3 text-xs text-slate-100"
            onChange={async (e) => {
              const value = e.target.value;
              const params = new URLSearchParams();
              if (value) params.set('projectName', value);
              const res = await api.get<ApiResponse<Task[]>>(
                `/tasks?${params.toString()}`,
              );
              queryClient.setQueryData(['tasks'], res.data.data);
            }}
          >
            <option value="">Project: All</option>
            {projectOptions.map((project) => (
              <option key={project} value={project}>
                {project}
              </option>
            ))}
          </select>
        </div>

        {tasksLoading ? (
          <div className="flex flex-1 items-center justify-center">
            <p className="text-slate-300">Loading tasks...</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {(tasks || []).map((task) => (
              <div
                key={task._id}
                className="flex flex-col justify-between rounded-lg border border-slate-800 bg-slate-900/70 p-4 shadow-sm"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-slate-400">
                      {task.taskId}
                    </span>
                    <Badge variant={priorityBadgeVariant(task.priority)}>
                      {task.priority}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-400">{task.projectName}</p>
                  <h3 className="text-sm font-semibold">{task.taskTitle}</h3>
                  {task.taskDetails && (
                    <p className="text-xs text-slate-300">{task.taskDetails}</p>
                  )}
                </div>
                <div className="mt-3 space-y-2 text-xs text-slate-300">
                  <div className="flex items-center justify-between">
                    <Badge variant={statusBadgeVariant(task.status)}>
                      {task.status}
                    </Badge>
                    {task.dueDate && (
                      <span>
                        Due:{' '}
                        {new Date(task.dueDate).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    {task.estTime && <span>Est: {task.estTime}</span>}
                    {task.loggedTime && <span>Logged: {task.loggedTime}</span>}
                  </div>
                  {task.notes && (
                    <p className="text-slate-400">Notes: {task.notes}</p>
                  )}
                </div>
                <div className="mt-3 flex items-center justify-between gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-slate-700 bg-slate-900 text-xs text-slate-100 hover:bg-slate-800"
                    onClick={() =>
                      updateMutation.mutate({
                        id: task._id,
                        data: {
                          status:
                            task.status === 'Completed'
                              ? 'Pending'
                              : 'Completed',
                        },
                      })
                    }
                  >
                    {task.status === 'Completed' ? 'Mark Incomplete' : 'Mark Complete'}
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="text-xs"
                    onClick={() => deleteMutation.mutate(task._id)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
