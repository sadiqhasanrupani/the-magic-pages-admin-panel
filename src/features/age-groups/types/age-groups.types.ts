export interface CreateAgeGroupDto {
}

// --- Age Group ---
export interface AgeGroup {
  id: string;
  label: string;
  sortOrder: number;
  description: string;
  heroImage: string;
}

export interface CreateAgeGroupPayload { }

export type UpdateAgeGroupPayload = Partial<CreateAgeGroupPayload>;

export interface FindAllResponse {
  data: AgeGroup[];
}


// export interface FindAllResponse {
// data: AgeGroup[];
// meta: {
//   itemsPerPage: number;
//   totalItems: number;
//   currentPage: number;
//   totalPages: number;
// };
// }

export interface AgeGroupQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}
