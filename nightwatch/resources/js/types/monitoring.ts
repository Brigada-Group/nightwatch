import type { PaginatedResponse } from '@/entities';

export type ProjectOption = {
    id: number;
    name: string;
};

export type WithProjectRelation<T> = T & {
    project?: ProjectOption;
};

export type ListFilters = Record<
    string,
    string | number | boolean | null | undefined
>;

export type PaginatedProps<T> = PaginatedResponse<WithProjectRelation<T>>;
