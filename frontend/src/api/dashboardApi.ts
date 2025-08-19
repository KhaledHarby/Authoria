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
  action: string;
  resourceType: string;
  method: string;
  occurredAtUtc: string;
  actorUserId?: string;
  statusCode?: number;
  ipAddress: string;
  path: string;
}

export const dashboardApi = {
  // Get dashboard statistics
  getStats: async (): Promise<DashboardStats> => {
    const response = await http.get<DashboardStats>('/api/dashboard/stats');
    return response.data;
  },

  // Get recent activities (last 10 audit logs)
  getRecentActivities: async (): Promise<RecentActivity[]> => {
    const response = await http.get<RecentActivity[]>('/api/audit/recent?take=10');
    return response.data;
  },

  // Get recent activities with pagination
  getRecentActivitiesPaginated: async (take: number = 10): Promise<RecentActivity[]> => {
    const response = await http.get<RecentActivity[]>(`/api/audit/recent?take=${take}`);
    return response.data;
  }
};

