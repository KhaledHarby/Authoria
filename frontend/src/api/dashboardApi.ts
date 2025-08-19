import http from './http';

export interface DashboardStats {
  totalUsers: number;
  activeRoles: number;
  totalPermissions: number;
  totalAuditEvents: number;
  recentActivityCount: number;
}

export interface RecentActivity {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  occurredAtUtc: string;
  actorUserId?: string;
}

export const dashboardApi = {
  // Get dashboard statistics
  getStats: async (): Promise<DashboardStats> => {
    const response = await http.get<DashboardStats>('/api/dashboard/stats');
    return response.data;
  },

  // Get meaningful recent activities
  getRecentActivities: async (): Promise<RecentActivity[]> => {
    const response = await http.get<RecentActivity[]>('/api/dashboard/recent-activities?take=10');
    return response.data;
  },

  // Get recent activities with pagination
  getRecentActivitiesPaginated: async (take: number = 10): Promise<RecentActivity[]> => {
    const response = await http.get<RecentActivity[]>(`/api/dashboard/recent-activities?take=${take}`);
    return response.data;
  }
};

