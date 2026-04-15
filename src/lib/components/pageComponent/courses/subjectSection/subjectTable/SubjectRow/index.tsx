import React from 'react';
import { Checkbox, TableCell, TableRow, capitalize, Tooltip } from '@mui/material';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import { Subject } from '@/lib/types/subject';

interface Props {
  subject: Subject;
  checked: boolean;
  disabled?: boolean;
  onToggle: () => void;
  isReadOnly?: boolean;
  onRowClick?: (subject: Subject) => void;
}

const SubjectRow: React.FC<Props> = ({ subject, checked, disabled = false, onToggle, isReadOnly, onRowClick }) => {
  const hasRelations =
    (subject.dependencies && subject.dependencies.length > 0) ||
    (subject.requiredBy && subject.requiredBy.length > 0);

  return (
    <TableRow
      key={subject.id}
      hover
      role="checkbox"
      aria-checked={checked}
      selected={checked}
      sx={{ cursor: onRowClick ? 'pointer' : 'default' }}
    >
      {!isReadOnly && (
        <TableCell padding="checkbox" onClick={(e) => e.stopPropagation()}>
          <Checkbox
            checked={checked}
            onChange={onToggle}
            disabled={disabled}
          />
        </TableCell>
      )}
      <TableCell onClick={() => onRowClick?.(subject)}>{subject.code ?? '-'}</TableCell>
      <TableCell onClick={() => onRowClick?.(subject)}>{subject.name ?? '-'}</TableCell>
      <TableCell onClick={() => onRowClick?.(subject)}>{subject.credit ?? '-'}</TableCell>
      <TableCell onClick={() => onRowClick?.(subject)}>{capitalize((subject.language as string) ?? '-')}</TableCell>
      <TableCell onClick={() => onRowClick?.(subject)} align="center">
        {hasRelations && (
          <Tooltip title="มีความต้องการก่อนเรียน">
            <AccountTreeIcon fontSize="small" color="action" />
          </Tooltip>
        )}
      </TableCell>
    </TableRow>
  );
};

export default SubjectRow;
