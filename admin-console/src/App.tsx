import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { useThemeStore } from './store/theme';
import { AppRoutes } from './routes';
import { getTheme } from './lib/theme';

function App() {
  const { mode } = useThemeStore();
  const theme = getTheme(mode);

  return (
    <ThemeProvider theme={theme}>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;

