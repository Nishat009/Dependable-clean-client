// Shapes of the data the API sends and receives. Ids are strings once they reach the browser.

export type ProductType = 'spray' | 'dish' | 'bath' | 'detergent' | 'bucket' | 'pump';

export interface Service {
  active?: boolean;
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
  /** Picks the product photo. Services from the API usually leave it out and are matched by name. */
  product?: ProductType;
}

/** The fields an admin edits on the service form. */
export type ServiceInput = Omit<Service, '_id' | 'product'>;

export interface Location {
  _id: string;
  name: string;
  city?: string;
  thana?: string;
  address?: string;
  /** Inactive areas stay on the list but cannot be booked. Missing means active. */
  active?: boolean;
}

/** The location fields the super admin fills in. The city is always Dhaka. */
export interface LocationInput { name: string; thana: string; address: string }

export const bookingStatuses = ['requested', 'confirmed', 'assigned', 'in_progress', 'completed', 'cancelled'] as const;
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
  thana?: string;
  name: string;
  email: string;
  status: BookingStatus;
  createdAt: string;
  /** Set on /reviewOrders when the customer has already reviewed this order. */
  reviewed?: boolean;
  staffEmail?: string;
  phone?: string;
  internalNotes?: { text: string; author: string; createdAt: string }[];
  changeRequest?: { type: string; date?: string };
  scope?: { details: string; includes: string[] };
}

export const reviewStatuses = ['Pending', 'Approved', 'Rejected', 'Hidden'] as const;
export type ReviewStatus = typeof reviewStatuses[number];

export interface Review {
  _id: string;
  name: string;
  email?: string;
  rating?: number;
  comments: string;
  orderId?: string;
  orderName?: string;
  status: ReviewStatus;
  createdAt?: string;
  demo?: boolean;
}

/** A customer's support ticket. Customers have one each; the owner can assign it to a staff member. */
export interface SupportTicket {
  _id: string;
  name: string;
  email: string;
  status: 'open' | 'resolved';
  unread: number;
  /** Hidden from customers. */
  staffEmail?: string | null;
  staffName?: string | null;
}

export interface SupportMessage {
  _id: string;
  /** The writer's email, or 'support' when a customer reads a reply from the team. */
  author: string;
  authorName?: string;
  text: string;
  createdAt: string;
  readBy: string[];
}

export type Role ='super_admin' | 'sub_admin' | 'staff' | 'customer' | 'admin';

/** The owner and sub admins run the business. Only the owner manages the team. */
export const isManager = (role?: Role) => role === 'super_admin' || role === 'sub_admin' || role === 'admin';

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
  active?: boolean;
  role?: Role;
}
