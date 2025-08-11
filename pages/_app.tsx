import type { AppProps } from 'next/app';
import { SettingsProvider } from '../contexts/SettingsContext';
import '../styles/globals.css';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <SettingsProvider>
      <Component {...pageProps} />
    </SettingsProvider>
  );
}
