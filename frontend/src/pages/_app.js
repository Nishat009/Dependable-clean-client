import '../design/styles.css';
import '../design/motion.css';
import AppProviders from '../legacy/Components/AppProviders';

export default function App({ Component, pageProps }) {
  return <AppProviders><Component {...pageProps} /></AppProviders>;
}
