// src/app/models/criteria.model.ts

export interface User {
  _id: string;
  fullname: string;
  username: string;
  // أضف أي حقول أخرى للمستخدم تحتاجها
}

export interface Sector {
  _id: string;
  name: string;
}

export interface SubCriteria {
  _id: string;
  name: string;
  mainCriteria: string; // ObjectId of MainCriteria
  userId: User; // populated user
}
export type Level = 'ALL' | 'SECTOR' | 'DEPARTMENT';

export interface MainCriterion {
  _id?: string;
  name: string;
  level: Level;
  sector?: string;
  departmentUser?: string;

  // لتفادي أخطاء Angular في القالب
  sectorName?: string;
  departmentName?: string;
}


// واجهات لبيانات الإدخال (Payloads)
export interface AddMainCriteriaPayload {
  name: string;
  level: 'ALL' | 'SECTOR' | 'DEPARTMENT';
  sector?: string; // ObjectId of Sector, required if level is SECTOR
  departmentUser?: string; // ObjectId of User, required if level is DEPARTMENT
}

export interface AddSubCriteriaPayload {
  name: string;
  mainCriteria: string; // ObjectId of MainCriteria
}

export interface UpdateMainCriteriaRequest {
  id: string;
  name: string;
  level?: string;
  sector?: string;
  departmentUser?: string;
}