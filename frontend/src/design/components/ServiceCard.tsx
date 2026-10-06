import React from 'react';
import Link from 'next/link';
import { formatMoney } from '../data';
import type { Service } from '../types';
import Icon from './Icon';
import Product, { productFor } from './Product';

interface ServiceCardProps {
  service: Service;
  index?: number;
  total?: number;
}

const pad = (value: number) => String(value).padStart(2, '0');

export default function ServiceCard({ service, index = 0, total = 6 }: ServiceCardProps) {
  return <Link href={'/book/' + service._id} className="service-card">
    <div className="service-card-top"><span className="service-index">{pad(index + 1)} / {pad(total)}</span><span className="service-card-arrow"><Icon name="arrowUp" size={20} /></span></div>
    <div className="service-visual" aria-hidden="true">
      <Product type={productFor(service, index)} className="service-product" wide />
    </div>
    <div className="service-card-content">
      <span className="service-category">{service.category || 'Cleaning service'}</span>
      <h3>{service.serviceName}</h3>
      <p>{service.details}</p>
      <ul className="service-card-facts">
        <li><Icon name="clock" size={15} />{service.duration || 'Flexible timing'}</li>
        <li><Icon name="users" size={15} />{service.teamSize || 1} {service.teamSize === 1 || !service.teamSize ? 'cleaner' : 'cleaners'}</li>
      </ul>
      <div className="service-card-meta"><span>{service.includes?.length ? service.includes.length + ' things included' : 'Made for your space'}</span><strong>From {formatMoney(service.price)}</strong></div>
    </div>
  </Link>;
}
