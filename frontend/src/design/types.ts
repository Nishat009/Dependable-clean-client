// Shapes of the data the API sends and receives. Ids are strings once they reach the browser.

export type ProductType = 'spray' | 'dish' | 'bath' | 'detergent' | 'bucket' | 'pump';

export interface Service {
  _id: string;
  serviceName: string;
  details: string;
  price: number;
  category?: string;
  duration?: string;
  teamSize?: number;
  idealFor?: string;
  suppliesIncluded?: boolean;
  includes?: string[];
  /** Ids of the locations this service covers. Empty means every location. */
  locations?: string[];
  /** Picks the product photo. Services from the API usually leave it out and are matched by name. */
  product?: ProductType;
}

/** The fields an admin edits on the service form. */
export type ServiceInput = Omit<Service, '_id' | 'product'>;

export interface Location {
  _id: string;
  name: string;
  city?: string;
}

export const bookingStatuses = ['Pending', 'Confirmed', 'In progress', 'Completed', 'Cancelled'] as const;
export type BookingStatus = typeof bookingStatuses[number];

export interface Booking {
  _id: string;
  serviceId: string;
  serviceName: string;
  price: number;
  date: string;
  address: string;
  notes?: string;
  locationId?: string | null;
  locationName?: string | null;
  name: string;
  email: string;
  status: BookingStatus;
  createdAt: string;
}

export const reviewStatuses = ['Pending', 'Approved', 'Rejected'] as const;
export type ReviewStatus = typeof reviewStatuses[number];

export interface Review {
  _id: string;
  name: string;
  email?: string;
  rating?: number;
  comments: string;
  status: ReviewStatus;
  createdAt?: string;
  demo?: boolean;
}

export type Role = 'admin' | 'customer';

export interface User {
  name: string;
  email: string;
  role: Role;
  demo: boolean;
}

export interface Session {
  token: string;
  user: User;
}

export interface TeamMember {
  _id: string;
  email: string;
  name: string;
  hasAccount: boolean;
}
