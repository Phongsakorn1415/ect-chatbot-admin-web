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
	Typography,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import 'dayjs/locale/th';
import type { InviteSearchKey, InviteSearchFilters } from '@/lib/types/invite-search';

interface Props {
	filters: InviteSearchFilters;
	onFiltersChange: (filters: InviteSearchFilters) => void;
	onApplySearch: () => void;
	onClearSearch: () => void;
}

const getSearchLabel = (key: InviteSearchKey) => {
	switch (key) {
		case 'firstName':
			return 'ค้นหาด้วยชื่อ';
		case 'lastName':
			return 'ค้นหาด้วยนามสกุล';
		case 'title':
			return 'ค้นหาด้วยคำนำหน้า';
		case 'email':
			return 'ค้นหาด้วยอีเมล';
		default:
			return 'ค้นหา';
	}
};

const InviteSearchControls: React.FC<Props> = ({
	filters,
	onFiltersChange,
	onApplySearch,
	onClearSearch,
}) => {
	const handleSearchKeyChange = (key: InviteSearchKey) => {
		onFiltersChange({
			...filters,
			searchKey: key,
			searchQuery: '',
		});
	};

	const handleSearchQueryChange = (query: string) => {
		onFiltersChange({
			...filters,
			searchQuery: query,
		});
	};

	const handleRoleChange = (role: string) => {
		onFiltersChange({
			...filters,
			role,
		});
	};

	const handleStatusChange = (status: string) => {
		onFiltersChange({
			...filters,
			status,
		});
	};

	const handleDateRangeChange = (field: 'start' | 'end', date: Dayjs | null) => {
		onFiltersChange({
			...filters,
			dateRange: {
				...filters.dateRange,
				[field]: date,
			},
		});
	};

	const hasActiveFilters = () => {
		return (
			filters.searchQuery.trim() !== '' ||
			filters.role !== '' ||
			filters.status !== '' ||
			filters.dateRange.start !== null ||
			filters.dateRange.end !== null
		);
	};

	return (
		<LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="th">
			<Box sx={{ mb: 3 }}>
				{/* Desktop Search Controls */}
				<FormGroup
					sx={{
						display: { xs: 'none', md: 'flex' },
						flexDirection: 'row',
						alignItems: 'center',
						gap: 2,
						flexWrap: 'wrap',
					}}
				>
					{/* Search Key Selection */}
					<FormControl size="small" sx={{ minWidth: 160 }}>
						<InputLabel id="search-key-label">ค้นหาด้วย</InputLabel>
						<Select
							labelId="search-key-label"
							label="ค้นหาด้วย"
							value={filters.searchKey}
							onChange={(e) => handleSearchKeyChange(e.target.value as InviteSearchKey)}
						>
							<MenuItem value="firstName">ชื่อ</MenuItem>
							<MenuItem value="lastName">นามสกุล</MenuItem>
							<MenuItem value="title">คำนำหน้า</MenuItem>
							<MenuItem value="email">Email</MenuItem>
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
							<MenuItem value="TEACHER">Teacher</MenuItem>
						</Select>
					</FormControl>

					{/* Status Filter */}
								<FormControl size="small" sx={{ minWidth: 140 }}>
						<InputLabel id="status-filter-label">สถานะ</InputLabel>
						<Select
							labelId="status-filter-label"
							label="สถานะ"
							value={filters.status}
							onChange={(e) => handleStatusChange(e.target.value)}
						>
							<MenuItem value="">ทั้งหมด</MenuItem>
							<MenuItem value="PENDING">Pending</MenuItem>
							<MenuItem value="ACCEPTED">Accepted</MenuItem>
							<MenuItem value="EXPIRED">Expired</MenuItem>
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
								onChange={(e) => handleSearchKeyChange(e.target.value as InviteSearchKey)}
							>
								<MenuItem value="firstName">ชื่อ</MenuItem>
								<MenuItem value="lastName">นามสกุล</MenuItem>
								<MenuItem value="title">คำนำหน้า</MenuItem>
								<MenuItem value="email">Email</MenuItem>
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
								<MenuItem value="TEACHER">Teacher</MenuItem>
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

					{/* Mobile Status Row */}
								<FormControl size="small" fullWidth>
						<InputLabel id="status-filter-label-mobile">สถานะ</InputLabel>
						<Select
							labelId="status-filter-label-mobile"
							label="สถานะ"
							value={filters.status}
							onChange={(e) => handleStatusChange(e.target.value)}
							fullWidth
						>
							<MenuItem value="">ทั้งหมด</MenuItem>
							<MenuItem value="PENDING">Pending</MenuItem>
							<MenuItem value="ACCEPTED">Accepted</MenuItem>
							<MenuItem value="EXPIRED">Expired</MenuItem>
						</Select>
					</FormControl>
				</Box>

				{/* Date Range Section */}
				<Box
					sx={{
						display: 'flex',
						flexDirection: { xs: 'column', md: 'row' },
						alignItems: { xs: 'stretch', md: 'center' },
						gap: 2,
						flexWrap: 'wrap',
						mt: 2,
					}}
				>
					<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
						<Typography>วันที่เชิญ :</Typography>
					</Box>

					<Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 1, flex: 1 }}>
						<DatePicker
							label="จากวันที่"
							value={filters.dateRange.start}
							onChange={(date) => handleDateRangeChange('start', date)}
							slotProps={{ textField: { size: 'small', sx: { flex: 1 } } }}
						/>

						<DatePicker
							label="ถึงวันที่"
							value={filters.dateRange.end}
							onChange={(date) => handleDateRangeChange('end', date)}
							slotProps={{ textField: { size: 'small', sx: { flex: 1 } } }}
						/>
					</Box>

					{/* Action Buttons */}
					<Box sx={{ display: 'flex', gap: 1, flexDirection: { xs: 'row', md: 'row' } }}>
						<Button variant="contained" onClick={onApplySearch} size="small" fullWidth={false}>
							ค้นหา
						</Button>

						{hasActiveFilters() && (
							<Button variant="outlined" onClick={onClearSearch} size="small" fullWidth={false}>
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
							<Chip label={`Role: ${filters.role}`} size="small" onDelete={() => handleRoleChange('')} />
						)}

						{filters.status !== '' && (
							<Chip label={`สถานะ: ${filters.status}`} size="small" onDelete={() => handleStatusChange('')} />
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

export default InviteSearchControls;

