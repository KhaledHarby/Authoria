import http from './http';

export interface UserPermission {
  id: string;
  userId: string;
  permissionId: string;
  permissionName: string;
  permissionDescription?: string;
  grantedAtUtc: string;
  grantedByUserId?: string;
  grantedByUserName?: string;
  notes?: string;
}

export interface RolePermission {
  roleId: string;
  roleName: string;
  permissions: string[];
}

export interface UserPermissionsResponse {
  userId: string;
  userName: string;
  directPermissions: UserPermission[];
  rolePermissions: RolePermission[];
  allPermissions: string[];
}

export interface AssignUserPermissionRequest {
  userId: string;
  permissionId: string;
  notes?: string;
}

export interface RemoveUserPermissionRequest {
  userId: string;
  permissionId: string;
}

export const userPermissionsApi = {
  // Get user permissions (both direct and role-based)
  getUserPermissions: async (userId: string): Promise<UserPermissionsResponse> => {
    const response = await http.get(`/api/userpermissions/user/${userId}`);
    return response.data;
  },

  // Assign a direct permission to a user
  assignPermission: async (request: AssignUserPermissionRequest): Promise<UserPermission> => {
    const response = await http.post('/api/userpermissions/assign', request);
    return response.data;
  },

  // Remove a direct permission from a user
  removePermission: async (request: RemoveUserPermissionRequest): Promise<void> => {
    await http.delete('/api/userpermissions/remove', { data: request });
  },

  // Get all permissions for a user (combined from roles and direct assignments)
  getUserAllPermissions: async (userId: string): Promise<string[]> => {
    const response = await http.get(`/api/userpermissions/user/${userId}/all`);
    return response.data;
  },
};
