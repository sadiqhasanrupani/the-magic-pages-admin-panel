export interface CreateCategoryDto {
}

// --- Category ---
export interface Category {
  "id": string;
  "name": string;
  "slug": string;
  "age_group": string;
  "parent_id": string | null;
  "children": string[];
}

export interface CreateCategoryPayload { }

export type UpdateCategoryPayload = Partial<CreateCategoryPayload>;

export interface FindAllResponse {
  message: string;
  data: Category[];
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

export interface AgeCategoryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}
