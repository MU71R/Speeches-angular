
export interface User {
  _id: string;
  fullname: string;
  username: string;
}

export interface Sector {
  _id: string;
  name: string;
}

export interface SubCriteria {
  _id: string;
  name: string;
  mainCriteria: string;
  userId: User;
}
export type Level = 'ALL' | 'SECTOR' | 'DEPARTMENT';

export interface MainCriterion {
  _id?: string;
  name: string;
  level: Level;
  sector?: string;
  departmentUser?: string;
  sectorName?: string;
  departmentName?: string;
}

export interface AddMainCriteriaPayload {
  name: string;
  level: 'ALL' | 'SECTOR' | 'DEPARTMENT';
  sector?: string; 
  departmentUser?: string; 
}

export interface AddSubCriteriaPayload {
  name: string;
  mainCriteria: string; 
}

export interface UpdateMainCriteriaRequest {
  id: string;
  name: string;
  level?: string;
  sector?: string;
  departmentUser?: string;
}