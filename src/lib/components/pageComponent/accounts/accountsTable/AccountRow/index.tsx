import { TableRow, TableCell, Checkbox, Tooltip } from "@mui/material"
import { TableAccountProps } from "@/lib/types/accounts"

interface AccountRowProps {
    account: TableAccountProps;
    isSelected: boolean;
    onSelectRow: (id: string) => void;
    loading?: boolean;
}

const AccountRow = ({ account, isSelected, onSelectRow, loading = false }: AccountRowProps) => {
    const isSuperAdmin = account.role === 'SUPER_ADMIN';
    
    const handleSelectRow = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (!isSuperAdmin) {
            onSelectRow(account.id);
        }
    }

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('th-TH', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    return (
        <TableRow hover role="checkbox" aria-checked={isSelected} selected={isSelected}>
            <TableCell padding="checkbox">
                <Tooltip 
                    title={isSuperAdmin ? "ไม่สามารถเลือกบัญชีนี้ได้" : ""} 
                    arrow
                    placement="top"
                >
                    <span>
                        <Checkbox
                            checked={isSelected}
                            onChange={handleSelectRow}
                            disabled={loading || isSuperAdmin}
                            inputProps={{ "aria-labelledby": `account-${account.id}` }}
                        />
                    </span>
                </Tooltip>
            </TableCell>
            <TableCell>{account.title}</TableCell>
            <TableCell>{account.firstName}</TableCell>
            <TableCell>{account.lastName}</TableCell>
            <TableCell>{account.role}</TableCell>
            <TableCell>{formatDate(account.createdAt)}</TableCell>
        </TableRow>
    )
}
export default AccountRow