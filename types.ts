
export enum UserRole {
  ADMIN = 'ADMIN',
  LAWYER = 'LAWYER',
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
  subscriptionPlan?: 'basic' | 'pro' | 'enterprise';
  subscriptionStatus?: 'active' | 'pending_approval' | 'expired';
  organizationOwnerId?: string; // For enterprise team members
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export interface CaseFile {
  id: string;
  title: string;
  clientName: string;
  type: 'criminal' | 'civil' | 'commercial' | 'course';
  status: 'active' | 'closed' | 'pending';
  dateCreated: string;
  documents: CaseDocument[];
  analysis?: string;
  chatHistory?: ChatMessage[];
  userId?: string;
  assignedToUserId?: string; // Pour plan المكتب: affaire affectée à un avocat de l'équipe
  createdByUserId?: string;  // عضو الفريق الذي أنشأ القضية (بانتظار موافقة المدير)
}

export interface CaseDocument {
  id: string;
  name: string;
  type: string;
  content: string; // Base64
  uploadDate: string;
}

export interface Contract {
  id: string;
  title: string;
  type: string;
  parties: string;
  content: string; // HTML or Markdown content
  dateCreated: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: string; // ISO String
  time?: string; // Time in HH:mm format
  type: 'hearing' | 'meeting' | 'deadline';
  description?: string;
  caseId?: string;
  caseTitle?: string;
  userId?: string;   // For org owner: who created the event
  userName?: string; // For org owner: display name
}

export interface Invoice {
  id: string;
  date: string;
  amount: number;
  status: 'paid' | 'pending' | 'rejected';
  planName: string;
  receiptData?: string; // Base64 image of the bank transfer
  userEmail?: string;
  userName?: string;
}

export interface KPIData {
  totalCases: number;
  activeCases: number;
  wonCases: number;
  revenue: number;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'admin' | 'appointment' | 'invoice' | 'system' | 'info' | 'success' | 'error' | 'warning' | 'case';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  link?: string; // Optional link to related page
  metadata?: Record<string, any>; // Additional data
}

export const PLAN_LIMITS = {
  basic: { cases: 5, contracts: 2, maxFileSizeMB: 100 },
  pro: { cases: 50, contracts: 100, maxFileSizeMB: 100 },
  enterprise: { cases: 9999, contracts: 9999, maxFileSizeMB: 1024 }
};
export type LoginStep1Response = {
  ok: boolean;
  needs_otp: boolean;
  user_id?: string;
  message?: string;
  user?: User;
  token?: string;
};

export type LoginStep2Response = {
  ok: boolean;
  message?: string;
  user?: User;
  token?: string;
};