import { createRoot } from 'react-dom/client';
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import '@fontsource-variable/inter';
import LiveBank from './LiveBank';
import bank from './bank-config';
import './style.css';

<<<<<<< HEAD
document.title = bank.name + ' | Digital Banking';
=======
document.title = bank.name + ' | Account portal';
>>>>>>> 678d79545863d15ecabf859bc8c50ddc8da92df7
document.documentElement.dataset.bank = bank.theme;
const theme = createTheme({
  palette: { primary: { main: bank.color } },
  shape: { borderRadius: 10 },
  typography: { fontFamily: '"Inter Variable", Inter, sans-serif', button: { textTransform: 'none', fontWeight: 680 } },
  components: { MuiButton: { defaultProps: { disableElevation: true } } },
});
const switchUrl = 'https://sriramtpsiog.github.io/SharedDB/';
createRoot(document.getElementById('root')).render(
  <ThemeProvider theme={theme}><CssBaseline /><LiveBank bank={bank} switchUrl={switchUrl} /></ThemeProvider>,
);
