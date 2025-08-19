import CssBaseline from '@mui/material/CssBaseline';
import { Box } from '@mui/material';
import { Provider } from 'react-redux';
import { store } from './app/store';
import AppRoutes from './app/routes';
import { ThemeProvider } from './theme/ThemeProvider';
import './styles/rtl.css';
import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { initializeSettings } from './features/settings/settingsSlice';

function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(initializeSettings());
  }, [dispatch]);

  return (
    <Provider store={store}>
      <ThemeProvider>
        <CssBaseline />
        <Box sx={{ minHeight: '100vh', backgroundColor: 'background.default' }}>
          <AppRoutes />
        </Box>
      </ThemeProvider>
    </Provider>
  );
}

export default App;
