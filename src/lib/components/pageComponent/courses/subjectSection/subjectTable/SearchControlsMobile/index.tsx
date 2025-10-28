import React from 'react';
import { Box, Button, FormControl, InputLabel, Menu, MenuItem, Select, TextField } from '@mui/material';
import type { SearchKey } from '@/lib/types/subject-search';

interface Props {
  searchKey: SearchKey;
  onChangeSearchKey: (key: SearchKey) => void;
  searchQuery: string;
  onChangeSearchQuery: (q: string) => void;
  onApply: () => void;
  onClear: () => void;
}

// Co-located util: map search key to field label
const getSearchLabel = (key: SearchKey) => {
  switch (key) {
    case 'code':
      return 'ค้นหาด้วยรหัสวิชา';
    case 'name':
      return 'ค้นหาด้วยชื่อวิชา';
    case 'credit':
      return 'ค้นหาด้วยหน่วยกิต';
    default:
      return 'ค้นหาด้วยภาษาที่ใช้สอน';
  }
};

const SearchControlsMobile: React.FC<Props> = ({ searchKey, onChangeSearchKey, searchQuery, onChangeSearchQuery, onApply, onClear }) => {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const handleOpen = (e: React.MouseEvent<HTMLButtonElement>) => setAnchorEl(e.currentTarget);
  const handleClose = () => setAnchorEl(null);

  return (
    <Box sx={{ display: { xs: 'flex', md: 'none' }, gap: 1 }}>
      <Button variant="outlined" onClick={handleOpen} fullWidth>ค้นหา</Button>
      <Menu anchorEl={anchorEl} open={open} onClose={handleClose} keepMounted>
        <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1, minWidth: 260 }}>
          <FormControl size="small">
            <InputLabel id="mobile-search-key-label">ค้นหาด้วย</InputLabel>
            <Select
              labelId="mobile-search-key-label"
              label="ค้นหาด้วย"
              value={searchKey}
              onChange={(e) => onChangeSearchKey(e.target.value as SearchKey)}
            >
              <MenuItem value="code">รหัสวิชา</MenuItem>
              <MenuItem value="name">ชื่อวิชา</MenuItem>
              <MenuItem value="credit">หน่วยกิต</MenuItem>
              <MenuItem value="language">ภาษาที่ใช้สอน</MenuItem>
            </Select>
          </FormControl>
          <TextField
            size="small"
            label={getSearchLabel(searchKey)}
            value={searchQuery}
            onChange={(e) => onChangeSearchQuery(e.target.value)}
          />
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
            <Button onClick={() => { onClear(); }}>ล้าง</Button>
            <Button variant="contained" onClick={() => { onApply(); handleClose(); }}>ใช้</Button>
          </Box>
        </Box>
      </Menu>
    </Box>
  );
};

export default SearchControlsMobile;
