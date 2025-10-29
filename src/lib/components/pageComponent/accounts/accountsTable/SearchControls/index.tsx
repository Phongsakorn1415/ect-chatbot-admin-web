import React from 'react';
import { 
  Button, 
  FormControl, 
  FormGroup, 
  InputLabel, 
  MenuItem, 
  Select, 
  TextField, 
  Box,
  Chip,
  Typography
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import 'dayjs/locale/th';
import type { AccountSearchKey, AccountSearchFilters } from '@/lib/types/account-search';

interface Props {
  filters: AccountSearchFilters;
  onFiltersChange: (filters: AccountSearchFilters) => void;
  onApplySearch: () => void;
  onClearSearch: () => void;
}

// Co-located util: map search key to field label
const getSearchLabel = (key: AccountSearchKey) => {
  switch (key) {
    case 'firstName':
      return 'ค้นหาด้วยชื่อ';
    case 'lastName':
      return 'ค้นหาด้วยนามสกุล';
    case 'role':
      return 'ค้นหาด้วย Role';
    case 'title':
      return 'ค้นหาด้วยคำนำหน้า';
    default:
      return 'ค้นหา';
  }
};

const AccountSearchControls: React.FC<Props> = ({ 
  filters, 
  onFiltersChange, 
  onApplySearch, 
  onClearSearch 
}) => {
  const handleSearchKeyChange = (key: AccountSearchKey) => {
    onFiltersChange({
      ...filters,
      searchKey: key,
      searchQuery: '' // Clear search query when changing key
    });
  };

  const handleSearchQueryChange = (query: string) => {
    onFiltersChange({
      ...filters,
      searchQuery: query
    });
  };

  const handleRoleChange = (role: string) => {
    onFiltersChange({
      ...filters,
      role
    });
  };

  const handleDateRangeChange = (field: 'start' | 'end', date: Dayjs | null) => {
    onFiltersChange({
      ...filters,
      dateRange: {
        ...filters.dateRange,
        [field]: date
      }
    });
  };

  const hasActiveFilters = () => {
    return filters.searchQuery.trim() !== '' ||
           filters.role !== '' ||
           filters.dateRange.start !== null ||
           filters.dateRange.end !== null;
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="th">
      <Box sx={{ mb: 3 }}>
        {/* Desktop Search Controls */}
        <FormGroup sx={{ 
          display: { xs: 'none', md: 'flex' }, 
          flexDirection: 'row', 
          alignItems: 'center', 
          gap: 2,
          flexWrap: 'wrap'
        }}>
          {/* Search Key Selection */}
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel id="search-key-label">ค้นหาด้วย</InputLabel>
            <Select
              labelId="search-key-label"
              label="ค้นหาด้วย"
              value={filters.searchKey}
              onChange={(e) => handleSearchKeyChange(e.target.value as AccountSearchKey)}
            >
              <MenuItem value="firstName">ชื่อ</MenuItem>
              <MenuItem value="lastName">นามสกุล</MenuItem>
              <MenuItem value="title">คำนำหน้า</MenuItem>
              <MenuItem value="role">Role</MenuItem>
            </Select>
          </FormControl>

          {/* Search Query */}
          <TextField
            size="small"
            label={getSearchLabel(filters.searchKey)}
            value={filters.searchQuery}
            onChange={(e) => handleSearchQueryChange(e.target.value)}
            sx={{ minWidth: 200 }}
          />

          {/* Role Filter */}
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel id="role-filter-label">กรองตาม Role</InputLabel>
            <Select
              labelId="role-filter-label"
              label="กรองตาม Role"
              value={filters.role}
              onChange={(e) => handleRoleChange(e.target.value)}
            >
              <MenuItem value="">ทั้งหมด</MenuItem>
              <MenuItem value="SUPER_ADMIN">Super Admin</MenuItem>
              <MenuItem value="ADMIN">Admin</MenuItem>
              <MenuItem value="USER">User</MenuItem>
            </Select>
          </FormControl>
        </FormGroup>

        {/* Mobile Search Controls */}
        <Box sx={{ display: { xs: 'block', md: 'none' }, mb: 2 }}>
          {/* Mobile Search Row 1 */}
          <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
            <FormControl size="small" sx={{ flex: 1, minWidth: 120 }}>
              <InputLabel id="search-key-label-mobile">ค้นหาด้วย</InputLabel>
              <Select
                labelId="search-key-label-mobile"
                label="ค้นหาด้วย"
                value={filters.searchKey}
                fullWidth
                onChange={(e) => handleSearchKeyChange(e.target.value as AccountSearchKey)}
              >
                <MenuItem value="firstName">ชื่อ</MenuItem>
                <MenuItem value="lastName">นามสกุล</MenuItem>
                <MenuItem value="title">คำนำหน้า</MenuItem>
                <MenuItem value="role">Role</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ flex: 1, minWidth: 100 }}>
              <InputLabel id="role-filter-label-mobile">Role</InputLabel>
              <Select
                labelId="role-filter-label-mobile"
                label="Role"
                value={filters.role}
                onChange={(e) => handleRoleChange(e.target.value)}
                fullWidth
              >
                <MenuItem value="">ทั้งหมด</MenuItem>
                <MenuItem value="SUPER_ADMIN">Super Admin</MenuItem>
                <MenuItem value="ADMIN">Admin</MenuItem>
                <MenuItem value="USER">User</MenuItem>
              </Select>
            </FormControl>
          </Box>

          {/* Mobile Search Row 2 */}
          <TextField
            size="small"
            label={getSearchLabel(filters.searchKey)}
            value={filters.searchQuery}
            onChange={(e) => handleSearchQueryChange(e.target.value)}
            fullWidth
            sx={{ mb: 2 }}
          />
        </Box>

        {/* Date Range Section */}
        <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', md: 'row' }, 
          alignItems: { xs: 'stretch', md: 'center' }, 
          gap: 2,
          flexWrap: 'wrap',
          mt: 2
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {/* <Chip label="วันที่เข้าร่วม" variant="outlined" size="small" /> */}
            <Typography>
                วันที่เข้าร่วม :
            </Typography>
          </Box>
          
          <Box sx={{ 
            display: 'flex', 
            flexDirection: { xs: 'column', sm: 'row' }, 
            gap: 1, 
            flex: 1 
          }}>
            <DatePicker
              label="จากวันที่"
              value={filters.dateRange.start}
              onChange={(date) => handleDateRangeChange('start', date)}
              slotProps={{ 
                textField: { 
                  size: 'small',
                  sx: { flex: 1 }
                } 
              }}
            />
            
            <DatePicker
              label="ถึงวันที่"
              value={filters.dateRange.end}
              onChange={(date) => handleDateRangeChange('end', date)}
              slotProps={{ 
                textField: { 
                  size: 'small',
                  sx: { flex: 1 }
                } 
              }}
            />
          </Box>

          {/* Action Buttons */}
          <Box sx={{ display: 'flex', gap: 1, flexDirection: { xs: 'row', md: 'row' } }}>
            <Button 
              variant="contained" 
              onClick={onApplySearch}
              size="small"
              fullWidth={false}
            >
              ค้นหา
            </Button>
            
            {hasActiveFilters() && (
              <Button 
                variant="outlined" 
                onClick={onClearSearch}
                size="small"
                fullWidth={false}
              >
                ล้าง
              </Button>
            )}
          </Box>
        </Box>

        {/* Active Filters Display */}
        {hasActiveFilters() && (
          <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
            <Chip label="ตัวกรองที่ใช้:" variant="outlined" size="small" />
            
            {filters.searchQuery.trim() !== '' && (
              <Chip 
                label={`${getSearchLabel(filters.searchKey)}: ${filters.searchQuery}`}
                size="small"
                onDelete={() => handleSearchQueryChange('')}
              />
            )}
            
            {filters.role !== '' && (
              <Chip 
                label={`Role: ${filters.role}`}
                size="small"
                onDelete={() => handleRoleChange('')}
              />
            )}
            
            {filters.dateRange.start && (
              <Chip 
                label={`จากวันที่: ${filters.dateRange.start.format('DD/MM/YYYY')}`}
                size="small"
                onDelete={() => handleDateRangeChange('start', null)}
              />
            )}
            
            {filters.dateRange.end && (
              <Chip 
                label={`ถึงวันที่: ${filters.dateRange.end.format('DD/MM/YYYY')}`}
                size="small"
                onDelete={() => handleDateRangeChange('end', null)}
              />
            )}
          </Box>
        )}
      </Box>
    </LocalizationProvider>
  );
};

export default AccountSearchControls;
