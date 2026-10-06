import { Html, Head, Main, NextScript } from 'next/document';

// Flag JS before first paint so scroll-reveal elements start hidden instead of flashing in.
const motionFlag = "document.documentElement.classList.add('motion-ready')";

export default function Document() {
  return <Html lang="en" data-scroll-behavior="smooth"><Head><script dangerouslySetInnerHTML={{ __html: motionFlag }} /></Head><body><Main /><NextScript /></body></Html>;
}
