import React from 'react';
import type { ProductType, Service } from '../types';

// Product photos used by the hero slider, offer cards, service cards and the booking page.
// They come from Unsplash and are free to use under the Unsplash License: https://unsplash.com/license
// Each type has a tall 4:5 crop in public/products/<type>.jpg and a wide 4:3 crop in <type>-wide.jpg.
const photos: Record<ProductType, { alt: string; source: string }> = {
  spray: { alt: 'Clear glass spray bottle beside a small plant', source: 'https://unsplash.com/photos/OCmCO-wLe-s' },
  dish: { alt: 'Amber glass kitchen and bathroom cleaner bottles with a dish brush', source: 'https://unsplash.com/photos/uooMllXe6gE' },
  bath: { alt: 'Eco cleaning sprays on the edge of a bathtub with a cloth and gloves', source: 'https://unsplash.com/photos/SaVqlZczQXs' },
  detergent: { alt: 'White pump bottle resting on soft linen', source: 'https://unsplash.com/photos/LtGwgq7r_mc' },
  bucket: { alt: 'Cleaning powder being added to a mop bucket', source: 'https://unsplash.com/photos/DyM3Cv1r4I0' },
  pump: { alt: 'Ribbed green glass soap dispenser with a gold pump', source: 'https://unsplash.com/photos/7gYlkoV1e1A' },
};
export const productTypes = Object.keys(photos) as ProductType[];

const keywords: [RegExp, ProductType][] = [[/kitchen|dish/i, 'dish'], [/bath|tile|toilet/i, 'bath'], [/laundry|linen|fabric/i, 'detergent'], [/move|deep|reset/i, 'bucket'], [/office|work|soap/i, 'pump'], [/home|spray|surface|window/i, 'spray']];

// Picks a product for a service: explicit `product`, then a keyword in its name, then its position.
export function productFor(service: Pick<Service, 'product' | 'serviceName'> | undefined, index = 0): ProductType {
  if (service?.product && photos[service.product]) return service.product;
  const match = keywords.find(([pattern]) => pattern.test(service?.serviceName || ''));
  return match ? match[1] : productTypes[index % productTypes.length];
}

interface ProductProps {
  type?: ProductType;
  className?: string;
  /** Gives the photo its description. Without it the photo is decorative. */
  described?: boolean;
  /** Uses the 4:3 crop instead of the 4:5 one. */
  wide?: boolean;
  /** Loads straight away, for photos that are visible or about to animate in. */
  eager?: boolean;
}

export default function Product({ type = 'spray', className = '', described = false, wide = false, eager = false }: ProductProps) {
  const key = photos[type] ? type : 'spray';
  return <img
    className={'product product-' + key + (className ? ' ' + className : '')}
    src={`/products/${key}${wide ? '-wide' : ''}.jpg`}
    alt={described ? photos[key].alt : ''}
    width={wide ? 900 : 800}
    height={wide ? 675 : 1000}
    loading={eager ? 'eager' : 'lazy'}
    decoding="async"
  />;
}
