import { Dayjs } from 'dayjs';

export type InviteSearchKey = 'firstName' | 'lastName' | 'title' | 'email';

export interface InviteSearchFilters {
  searchKey: InviteSearchKey;
  searchQuery: string;
  dateRange: {
    start: Dayjs | null;
    end: Dayjs | null;
  };
  role: string;
  status: string;
}

export interface InviteSearchProps {
  filters: InviteSearchFilters;
  onFiltersChange: (filters: InviteSearchFilters) => void;
  onApplySearch: () => void;
  onClearSearch: () => void;
}
