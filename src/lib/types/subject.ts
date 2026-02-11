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
  prerequisiteId: number | null;
  prerequisiteFor?: Subject[];
}
