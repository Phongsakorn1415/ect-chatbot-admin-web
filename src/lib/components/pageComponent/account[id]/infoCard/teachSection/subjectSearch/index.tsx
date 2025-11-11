"use client";
import React from "react";
import { Box, TextField, FormControl, InputLabel, Select, MenuItem } from "@mui/material";

interface SubjectSearchProps {
  code: string;
  name: string;
  onCodeChange: (v: string) => void;
  onNameChange: (v: string) => void;
}

const SubjectSearch: React.FC<SubjectSearchProps> = ({ code, name, onCodeChange, onNameChange }) => {
  type SearchType = "code" | "name";
  const [searchType, setSearchType] = React.useState<SearchType>("code");

  const label = searchType === "code" ? "ค้นหารหัสวิชา" : "ค้นหาชื่อวิชา";
  const placeholder = searchType === "code" ? "เช่น 012345" : "เช่น คณิตศาสตร์";
  const value = searchType === "code" ? code : name;
  const handleChange = (v: string) => (searchType === "code" ? onCodeChange(v) : onNameChange(v));

  return (
    <Box sx={{ display: "flex", gap: 1, mb: 1, flexWrap: "wrap", alignItems: "center" }}>
      <FormControl size="small" sx={{ minWidth: 180 }}>
        <InputLabel id="subject-search-type-label">ค้นหาด้วย</InputLabel>
        <Select
          labelId="subject-search-type-label"
          id="subject-search-type"
          label="ค้นหาตาม"
          value={searchType}
          onChange={(e) => setSearchType((e.target.value as SearchType) ?? "code")}
        >
          <MenuItem value="code">รหัสวิชา</MenuItem>
          <MenuItem value="name">ชื่อวิชา</MenuItem>
        </Select>
      </FormControl>

      <TextField
        size="small"
        label={label}
        placeholder={placeholder}
        value={value}
        onChange={(e) => handleChange(e.target.value)}
      />
    </Box>
  );
};

export default SubjectSearch;
