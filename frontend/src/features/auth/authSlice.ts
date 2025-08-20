import { createSlice } from '@reduxjs/toolkit';

interface AuthState {
  accessToken: string | null;
  tenantId: string | null;
  applicationId: string | null;
  user: any | null;
  isAuthenticated: boolean;
}

const initialState: AuthState = {
  accessToken: localStorage.getItem('accessToken'),
  tenantId: localStorage.getItem('tenantId'),
  applicationId: localStorage.getItem('applicationId'),
  user: null,
  isAuthenticated: !!localStorage.getItem('accessToken'),
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      state.accessToken = action.payload.token;
      state.tenantId = action.payload.tenantId;
      state.applicationId = action.payload.applicationId || state.applicationId || null;
      state.user = action.payload.user || null;
      state.isAuthenticated = true;
      
      // Store in localStorage
      localStorage.setItem('accessToken', action.payload.token);
      localStorage.setItem('tenantId', action.payload.tenantId);
      if (state.applicationId) localStorage.setItem('applicationId', state.applicationId);
    },
    setApplicationId: (state, action) => {
      state.applicationId = action.payload || null;
      if (state.applicationId) localStorage.setItem('applicationId', state.applicationId);
      else localStorage.removeItem('applicationId');
    },
    logout: (state) => {
      state.accessToken = null;
      state.tenantId = null;
      state.applicationId = null;
      state.user = null;
      state.isAuthenticated = false;
      
      // Clear localStorage
      localStorage.removeItem('accessToken');
      localStorage.removeItem('tenantId');
      localStorage.removeItem('applicationId');
    },
  },
});

export const { setCredentials, setApplicationId, logout } = authSlice.actions;
export default authSlice.reducer;
