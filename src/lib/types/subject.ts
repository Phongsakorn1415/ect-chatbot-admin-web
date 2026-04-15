export interface SubjectRelation {
  id: number;
  subjectId: number;
  requiresId: number;
  type: "PRE" | "CO";
  requires?: Subject;
  subject?: Subject;
  createdAt?: string;
}

export interface Subject {
  id: number;
  code?: string | null;
  name: string | null;
  credit: number | null;
  language: string | null;
  isRequire: boolean | null;
  education_sectorId: number | null;
  course_yearId?: number | null;
  createdAt: string | null;
  updatedAt: string | null;
  dependencies?: SubjectRelation[];
  requiredBy?: SubjectRelation[];
}
