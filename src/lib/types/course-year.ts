export interface CourseYear {
  id: number;
  year: number;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface educationSector {
  id: number;
  year: number;
  semester: number;
  createdAt: string;
  updatedAt: string;
  course_yearId: number;
}
