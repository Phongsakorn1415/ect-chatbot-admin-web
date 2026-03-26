import React from 'react';
import { Checkbox, TableCell, TableRow, capitalize } from '@mui/material';
import { Subject } from '@/lib/types/subject';

interface Props {
  subject: Subject;
  checked: boolean;
  disabled?: boolean;
  onToggle: () => void;
  isReadOnly?: boolean;
}

const SubjectRow: React.FC<Props> = ({ subject, checked, disabled = false, onToggle, isReadOnly }) => {
  return (
    <TableRow
      key={subject.id}
      hover
      role="checkbox"
      aria-checked={checked}
      selected={checked}
    >
      {!isReadOnly && (
        <TableCell padding="checkbox">
          <Checkbox
            checked={checked}
            onChange={onToggle}
            disabled={disabled}
          />
        </TableCell>
      )}
      <TableCell>{subject.code ?? '-'}</TableCell>
      <TableCell>{subject.name ?? '-'}</TableCell>
      <TableCell>{subject.credit ?? '-'}</TableCell>
      <TableCell>{capitalize((subject.language as string) ?? '-') }</TableCell>
    </TableRow>
  );
};

export default SubjectRow;
