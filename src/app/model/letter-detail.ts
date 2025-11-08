export interface Decision {
  _id: string;
  title: string;
  sector?: {
    _id: string;
    sector: string;
  };
  supervisor?: string;
  isPresidentDecision?: boolean;
  createdAt?: string;
}

export interface User {
  _id: string;
  username: string;
  fullname: string;
  role: string;
  sector?: string;
}

export interface LetterDetail {
  _id: string;
  title: string;
  description: string;
  notes: string;
  decision: Decision; // ✅ كائن كامل
  date: string;
  status: 'pending' | 'approved' | 'rejected' | 'in_progress';
  user: User;
  createdAt?: string;
  updatedAt?: string;
}
