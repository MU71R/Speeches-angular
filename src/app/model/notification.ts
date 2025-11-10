export interface Notification {
  _id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: string;
  read: boolean;
  targetRole?: string;
  activity?: string;
  createdAt?: string;
  updatedAt?: string;
  seen?: boolean;
  __v?: number;
}
