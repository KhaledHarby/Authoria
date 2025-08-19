import { createTheme, ThemeProvider } from '@mui/material/styles';
import { useEffect } from 'react';

export default function DirectionProvider({ lang, children }: { lang: string; children: React.ReactNode }) {
	const dir = ['ar', 'he', 'fa', 'ur'].includes(lang) ? 'rtl' : 'ltr';
	useEffect(() => {
		document.documentElement.setAttribute('dir', dir);
		document.documentElement.setAttribute('lang', lang);
	}, [dir, lang]);
	const theme = createTheme({ direction: dir });
	return <ThemeProvider theme={theme}>{children}</ThemeProvider>;
}



