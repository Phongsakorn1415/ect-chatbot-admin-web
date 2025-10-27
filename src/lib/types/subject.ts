export interface Subject {
    id: number;
    name: string | null;
    credit: number | null;
    language: string | null;
    isRequire: boolean | null;
    education_sectorId: number | null;
    course_yearId?: number | null;
    createdAt: string | null;
    updatedAt: string | null;
}