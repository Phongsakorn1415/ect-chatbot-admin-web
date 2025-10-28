import React from 'react';
import { Button, FormControl, FormGroup, InputLabel, MenuItem, Select, TextField } from '@mui/material';
import type { SearchKey } from '@/lib/types/subject-search';

interface Props {
  searchKey: SearchKey;
  onChangeSearchKey: (key: SearchKey) => void;
  searchQuery: string;
  onChangeSearchQuery: (q: string) => void;
  onApply: () => void;
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

const SearchControls: React.FC<Props> = ({ searchKey, onChangeSearchKey, searchQuery, onChangeSearchQuery, onApply }) => {
  return (
    <FormGroup sx={{ display: { xs: 'none', md: 'flex' }, flexDirection: 'row', alignItems: 'center', gap: 1 }}>
      <FormControl size="small" sx={{ minWidth: 160 }}>
        <InputLabel id="search-key-label">ค้นหาด้วย</InputLabel>
        <Select
          labelId="search-key-label"
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
      <Button variant="contained" onClick={onApply}>ค้นหา</Button>
    </FormGroup>
  );
};

export default SearchControls;
