import type { AppProps } from 'next/app';
import '../design/styles.css';
import '../design/motion.css';
import '../design/products.css';
import '../design/carousel.css';
import '../design/hero-slider.css';
import '../design/features.css';
import '../design/controls.css';
import '../design/responsive.css';
import AppProviders from '../design/AppProviders';

export default function App({ Component, pageProps }: AppProps) {
  return <AppProviders><Component {...pageProps} /></AppProviders>;
}
