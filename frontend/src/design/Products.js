import React, { useId } from 'react';

// Hand-drawn SVG cleaning products used by the hero slider, offer cards and service cards.
// Each product shares one 220x320 canvas so they swap in place without layout shifts.

function Label({ x, y, width, height, ink = '#1b2a1c', accent = '#7fae2a', fill = '#fbfdf3' }) {
  const cx = x + width / 2;
  return <g>
    <rect x={x} y={y} width={width} height={height} rx="9" fill={fill} />
    <path d={`M${cx} ${y + 13}l2.6 7.4 7.4 2.6-7.4 2.6-2.6 7.4-2.6-7.4-7.4-2.6 7.4-2.6z`} fill={accent} />
    <text x={cx} y={y + 47} textAnchor="middle" fontFamily="Manrope, Arial, sans-serif" fontWeight="800" fontSize="9.5" letterSpacing="-.3" fill={ink}>dependable.</text>
    <rect x={cx - width * 0.28} y={y + 56} width={width * 0.56} height="3" rx="1.5" fill={accent} opacity=".55" />
    <rect x={cx - width * 0.2} y={y + 64} width={width * 0.4} height="3" rx="1.5" fill={ink} opacity=".18" />
  </g>;
}

function Shine({ x, y, height, opacity = 0.55 }) {
  return <rect x={x} y={y} width="7" height={height} rx="3.5" fill="#fff" opacity={opacity} />;
}

function Spray({ id }) {
  const body = 'M70 132C70 113 84 104 97 101h26c13 3 27 12 27 31l4 148c0 13-10 20-22 20H88c-12 0-22-7-22-20Z';
  return <>
    <defs>
      <linearGradient id={id + 'glass'} x1="0" x2="1"><stop offset="0" stopColor="#e9f7c9" stopOpacity=".55" /><stop offset=".5" stopColor="#f7fde9" stopOpacity=".25" /><stop offset="1" stopColor="#cfe79a" stopOpacity=".6" /></linearGradient>
      <linearGradient id={id + 'liquid'} x1="0" x2="1"><stop offset="0" stopColor="#b8e04c" /><stop offset=".55" stopColor="#dcf76f" /><stop offset="1" stopColor="#93c234" /></linearGradient>
      <linearGradient id={id + 'cap'} x1="0" x2="1"><stop offset="0" stopColor="#e7ece2" /><stop offset=".5" stopColor="#ffffff" /><stop offset="1" stopColor="#d3dccd" /></linearGradient>
      <clipPath id={id + 'clip'}><path d={body} /></clipPath>
    </defs>
    <g clipPath={`url(#${id}clip)`}>
      <rect x="60" y="150" width="100" height="160" fill={`url(#${id}liquid)`} />
      <path d="M60 150c18 6 36 6 50 0s34-6 50 0v6H60Z" fill="#effcc0" opacity=".8" className="p-wave" />
    </g>
    <path d={body} fill={`url(#${id}glass)`} stroke="#ffffff" strokeOpacity=".45" strokeWidth="1.5" />
    <path d="M110 103v190" stroke="#fff" strokeOpacity=".4" strokeWidth="2" />
    <Label x={82} y={190} width={56} height={74} />
    <Shine x={76} y={128} height={140} />
    <rect x="96" y="84" width="28" height="19" rx="3" fill={`url(#${id}cap)`} />
    <rect x="91" y="74" width="38" height="13" rx="4" fill={`url(#${id}cap)`} />
    <path d="M86 40h62c12 0 19 8 19 17v6h-37l-3 12H94l-3-19Z" fill={`url(#${id}cap)`} />
    <rect x="70" y="43" width="20" height="13" rx="3" fill="#dfe6d8" />
    <path d="M113 63c-1 17-6 29-13 38l7 3c8-10 13-24 14-41Z" fill="#e8ede3" />
    <circle cx="70" cy="49" r="2" fill="#9fc63e" />
  </>;
}

function DishSoap({ id }) {
  return <>
    <defs>
      <linearGradient id={id + 'body'} x1="0" x2="1"><stop offset="0" stopColor="#5f9a1c" /><stop offset=".45" stopColor="#a6dc43" /><stop offset="1" stopColor="#4f8418" /></linearGradient>
      <linearGradient id={id + 'cap'} x1="0" x2="1"><stop offset="0" stopColor="#e3e9dd" /><stop offset=".5" stopColor="#fff" /><stop offset="1" stopColor="#cdd6c6" /></linearGradient>
    </defs>
    <path d="M78 112c0-14 12-21 22-23h20c10 2 22 9 22 23l4 170c0 12-8 18-18 18H92c-10 0-18-6-18-18Z" fill={`url(#${id}body)`} />
    <path d="M78 112c0-14 12-21 22-23h20c10 2 22 9 22 23l4 170c0 12-8 18-18 18H92c-10 0-18-6-18-18Z" fill="none" stroke="#e3f7b0" strokeOpacity=".35" strokeWidth="1.5" />
    <rect x="95" y="56" width="30" height="35" rx="6" fill={`url(#${id}cap)`} />
    <rect x="99" y="45" width="22" height="14" rx="5" fill="#eef2ea" />
    <rect x="104" y="40" width="12" height="8" rx="3" fill="#d6ded0" />
    <Label x={81} y={168} width={58} height={78} accent="#5f9a1c" />
    <circle cx="110" cy="268" r="11" fill="#e9fbb2" opacity=".4" />
    <Shine x={84} y={112} height={150} opacity={0.4} />
  </>;
}

function BathCleaner({ id }) {
  return <>
    <defs>
      <linearGradient id={id + 'body'} x1="0" x2="1"><stop offset="0" stopColor="#3fa597" /><stop offset=".45" stopColor="#8fe3d4" /><stop offset="1" stopColor="#2f8b7f" /></linearGradient>
      <linearGradient id={id + 'neck'} x1="0" x2="1"><stop offset="0" stopColor="#e6ece2" /><stop offset=".5" stopColor="#ffffff" /><stop offset="1" stopColor="#ccd6c8" /></linearGradient>
    </defs>
    <path d="M100 118l4-30c2-15 12-25 27-29l22-6 4 12-20 8c-10 4-15 12-15 22l2 23Z" fill={`url(#${id}neck)`} />
    <rect x="148" y="46" width="16" height="22" rx="4" transform="rotate(-18 156 57)" fill="#d7fb60" />
    <path d="M66 152c0-22 15-33 34-35h28c19 2 30 14 30 35l2 130c0 12-8 18-20 18H84c-12 0-20-6-20-18Z" fill={`url(#${id}body)`} />
    <Label x={80} y={180} width={62} height={78} accent="#2f8b7f" />
    <Shine x={74} y={150} height={128} opacity={0.4} />
  </>;
}

function Detergent({ id }) {
  return <>
    <defs>
      <linearGradient id={id + 'body'} x1="0" x2="1"><stop offset="0" stopColor="#d8ddcf" /><stop offset=".45" stopColor="#fbfcf6" /><stop offset="1" stopColor="#c3cbb9" /></linearGradient>
      <linearGradient id={id + 'band'} x1="0" x2="1"><stop offset="0" stopColor="#c4ec4f" /><stop offset="1" stopColor="#e0fb7c" /></linearGradient>
    </defs>
    <path d="M132 112V88c0-10 7-17 17-17h10c10 0 17 8 17 18v52" fill="none" stroke={`url(#${id}body)`} strokeWidth="15" strokeLinecap="round" />
    <path d="M50 142c0-20 14-31 34-33h68c17 2 26 14 26 33l2 140c0 12-8 18-20 18H70c-12 0-20-6-20-18Z" fill={`url(#${id}body)`} />
    <rect x="66" y="84" width="42" height="27" rx="5" fill="#d7fb60" />
    <rect x="62" y="104" width="50" height="9" rx="3" fill="#b9dc4f" />
    <rect x="60" y="168" width="110" height="94" rx="14" fill={`url(#${id}band)`} />
    <path d="M115 186l3.4 9.6 9.6 3.4-9.6 3.4-3.4 9.6-3.4-9.6-9.6-3.4 9.6-3.4z" fill="#1b2a1c" />
    <text x="115" y="234" textAnchor="middle" fontFamily="Manrope, Arial, sans-serif" fontWeight="800" fontSize="12" letterSpacing="-.4" fill="#1b2a1c">dependable.</text>
    <text x="115" y="249" textAnchor="middle" fontFamily="Manrope, Arial, sans-serif" fontWeight="700" fontSize="7" letterSpacing="1.4" fill="#1b2a1c" opacity=".6">FRESH LINEN</text>
    <Shine x={58} y={140} height={140} opacity={0.6} />
  </>;
}

function Bucket({ id }) {
  return <>
    <defs>
      <linearGradient id={id + 'body'} x1="0" x2="1"><stop offset="0" stopColor="#8fbd2f" /><stop offset=".45" stopColor="#d7fb60" /><stop offset="1" stopColor="#7ba826" /></linearGradient>
      <linearGradient id={id + 'sponge'} x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#fff2a8" /><stop offset="1" stopColor="#f2d65c" /></linearGradient>
    </defs>
    <path d="M58 176c0-80 104-80 104 0" fill="none" stroke="#c8d0c0" strokeWidth="5" />
    <g className="p-foam">
      <circle cx="80" cy="166" r="16" fill="#fff" /><circle cx="104" cy="158" r="20" fill="#fff" /><circle cx="132" cy="162" r="17" fill="#f7faef" /><circle cx="152" cy="168" r="12" fill="#fff" />
      <circle cx="96" cy="140" r="7" fill="none" stroke="#fff" strokeOpacity=".8" strokeWidth="1.5" /><circle cx="140" cy="138" r="5" fill="none" stroke="#fff" strokeOpacity=".8" strokeWidth="1.5" />
    </g>
    <g transform="rotate(-14 146 132)">
      <rect x="120" y="116" width="62" height="34" rx="8" fill={`url(#${id}sponge)`} />
      <rect x="120" y="108" width="62" height="12" rx="5" fill="#4f8418" />
    </g>
    <path d="M50 172h120l-12 120c-1 6-6 8-12 8H74c-6 0-11-2-12-8Z" fill={`url(#${id}body)`} />
    <rect x="44" y="164" width="132" height="15" rx="7.5" fill="#c4ec4f" />
    <path d="M110 214l3.6 10.4 10.4 3.6-10.4 3.6-3.6 10.4-3.6-10.4-10.4-3.6 10.4-3.6z" fill="#1b2a1c" opacity=".8" />
    <text x="110" y="262" textAnchor="middle" fontFamily="Manrope, Arial, sans-serif" fontWeight="800" fontSize="11" letterSpacing="-.4" fill="#1b2a1c" opacity=".85">dependable.</text>
    <Shine x={64} y={182} height={96} opacity={0.45} />
  </>;
}

function FoamPump({ id }) {
  return <>
    <defs>
      <linearGradient id={id + 'glass'} x1="0" x2="1"><stop offset="0" stopColor="#f3e7c4" stopOpacity=".7" /><stop offset=".5" stopColor="#fffaf0" stopOpacity=".35" /><stop offset="1" stopColor="#e4d4a6" stopOpacity=".75" /></linearGradient>
      <linearGradient id={id + 'liquid'} x1="0" x2="1"><stop offset="0" stopColor="#e9c46a" /><stop offset=".5" stopColor="#f6dc8d" /><stop offset="1" stopColor="#d8ac46" /></linearGradient>
      <linearGradient id={id + 'metal'} x1="0" x2="1"><stop offset="0" stopColor="#1f2a21" /><stop offset=".5" stopColor="#4a5a4b" /><stop offset="1" stopColor="#1a231c" /></linearGradient>
    </defs>
    <path d="M86 68h62c6 0 9 4 9 9v8H86Z" fill={`url(#${id}metal)`} />
    <path d="M150 70l28 4v9l-28-2Z" fill={`url(#${id}metal)`} />
    <rect x="103" y="84" width="14" height="26" rx="3" fill={`url(#${id}metal)`} />
    <rect x="92" y="106" width="36" height="26" rx="6" fill={`url(#${id}metal)`} />
    <rect x="70" y="128" width="80" height="172" rx="24" fill={`url(#${id}liquid)`} opacity=".9" />
    <rect x="70" y="128" width="80" height="40" rx="20" fill="#fff8e4" opacity=".55" />
    <rect x="70" y="128" width="80" height="172" rx="24" fill={`url(#${id}glass)`} stroke="#fff" strokeOpacity=".5" strokeWidth="1.5" />
    <Label x={82} y={190} width={56} height={74} accent="#c08f2a" />
    <Shine x={78} y={140} height={140} opacity={0.6} />
  </>;
}

const shapes = { spray: Spray, dish: DishSoap, bath: BathCleaner, detergent: Detergent, bucket: Bucket, pump: FoamPump };
export const productTypes = Object.keys(shapes);

const keywords = [[/kitchen|dish/i, 'dish'], [/bath|tile|toilet/i, 'bath'], [/laundry|linen|fabric/i, 'detergent'], [/move|deep|reset/i, 'bucket'], [/office|work|soap/i, 'pump'], [/home|spray|surface/i, 'spray']];

// Picks a product for a service: explicit `product`, then a keyword in its name, then its position.
export function productFor(service, index = 0) {
  if (service?.product && shapes[service.product]) return service.product;
  const match = keywords.find(([pattern]) => pattern.test(service?.serviceName || ''));
  return match ? match[1] : productTypes[index % productTypes.length];
}

export default function Product({ type = 'spray', className = '', title }) {
  const id = 'p' + useId().replace(/[^a-zA-Z0-9]/g, '');
  const Shape = shapes[type] || Spray;
  return <svg className={'product product-' + type + (className ? ' ' + className : '')} viewBox="0 0 220 320" role={title ? 'img' : undefined} aria-label={title} aria-hidden={title ? undefined : true}>
    <ellipse cx="110" cy="304" rx="66" ry="8" fill="#000" opacity=".22" />
    <Shape id={id} />
    <g className="p-glint" fill="#fff"><path d="M160 116l2 6 6 2-6 2-2 6-2-6-6-2 6-2z" /><path d="M58 210l1.4 4 4 1.4-4 1.4-1.4 4-1.4-4-4-1.4 4-1.4z" /></g>
  </svg>;
}
