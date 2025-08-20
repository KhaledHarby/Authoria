import http from './http';

export interface Application {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  createdAtUtc: string;
}

export interface ApplicationUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export interface UpdateApplicationRequest {
  name: string;
  description?: string;
}

export const applicationsApi = {
  list: async (): Promise<Application[]> => {
    const res = await http.get('/api/applications');
    return res.data.items || res.data;
  },
  create: async (payload: { name: string; description?: string }): Promise<Application> => {
    const res = await http.post('/api/applications', payload);
    return res.data;
  },
  update: async (id: string, payload: UpdateApplicationRequest): Promise<Application> => {
    const res = await http.put(`/api/applications/${id}`, payload);
    return res.data;
  },
  delete: async (id: string): Promise<void> => {
    await http.delete(`/api/applications/${id}`);
  },
  listUserApplications: async (userId: string): Promise<{ id: string; name: string }[]> => {
    const res = await http.get(`/api/applications/user/${userId}`);
    return res.data;
  },
  listApplicationUsers: async (applicationId: string): Promise<ApplicationUser[]> => {
    const res = await http.get(`/api/applications/${applicationId}/users`);
    return res.data;
  },
  addUserToApplication: async (applicationId: string, userId: string): Promise<void> => {
    await http.post(`/api/applications/${applicationId}/users/${userId}`);
  },
  removeUserFromApplication: async (applicationId: string, userId: string): Promise<void> => {
    await http.delete(`/api/applications/${applicationId}/users/${userId}`);
  }
};
