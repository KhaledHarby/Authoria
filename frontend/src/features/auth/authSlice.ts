import { createSlice } from '@reduxjs/toolkit';

interface AuthState {
  accessToken: string | null;
  tenantId: string | null;
  user: any | null;
  isAuthenticated: boolean;
}

const initialState: AuthState = {
  accessToken: localStorage.getItem('accessToken'),
  tenantId: localStorage.getItem('tenantId'),
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
      state.user = action.payload.user || null;
      state.isAuthenticated = true;
      
      // Store in localStorage
      localStorage.setItem('accessToken', action.payload.token);
      localStorage.setItem('tenantId', action.payload.tenantId);
    },
    logout: (state) => {
      state.accessToken = null;
      state.tenantId = null;
      state.user = null;
      state.isAuthenticated = false;
      
      // Clear localStorage
      localStorage.removeItem('accessToken');
      localStorage.removeItem('tenantId');
    },
  },
});

export const { setCredentials, logout } = authSlice.actions;
export default authSlice.reducer;
