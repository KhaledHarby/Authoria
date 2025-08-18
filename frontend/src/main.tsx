import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import './i18n'
import DirectionProvider from './ui/DirectionProvider'
import { Provider } from 'react-redux'
import { store } from './app/store'

createRoot(document.getElementById('root')!).render(
	<StrictMode>
		<Provider store={store}>
			<DirectionProvider lang={"en"}>
				<App />
			</DirectionProvider>
		</Provider>
	</StrictMode>,
)
