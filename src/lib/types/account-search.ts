import { Dayjs } from 'dayjs';

export type AccountSearchKey = 'firstName' | 'lastName' | 'role' | 'title';

export interface AccountSearchFilters {
  searchKey: AccountSearchKey;
  searchQuery: string;
  dateRange: {
    start: Dayjs | null;
    end: Dayjs | null;
  };
  role: string;
}

export interface AccountSearchProps {
  filters: AccountSearchFilters;
  onFiltersChange: (filters: AccountSearchFilters) => void;
  onApplySearch: () => void;
  onClearSearch: () => void;
}