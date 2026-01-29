"use client"

import { TableRow, TableCell, Checkbox, Tooltip, CircularProgress, Backdrop } from "@mui/material"
import { TableAccountProps } from "@/lib/types/accounts"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { useTransition } from "react"
interface AccountRowProps {
    account: TableAccountProps;
    isSelected: boolean;
    onSelectRow: (id: string) => void;
    loading?: boolean;
}

const AccountRow = ({ account, isSelected, onSelectRow, loading = false }: AccountRowProps) => {
    const router = useRouter();
    const { data: session } = useSession();
    const isSuperAdmin = account.role === 'SUPER_ADMIN';

    const [isPending, startTransition] = useTransition();

    const handleSelectRow = (event: React.ChangeEvent<HTMLInputElement>) => {
        // Prevent row click navigation when interacting with the checkbox
        event.stopPropagation();
        if (!isSuperAdmin) {
            onSelectRow(account.id);
        }
    }

    const handleRowClick = () => {
        const currentUserId = session?.user?.id;
        startTransition(() => {
            if (currentUserId && currentUserId === account.id) {
                router.push(`/admin/myprofile`);
            } else {
                router.push(`/admin/accounts/${account.id}`);
            }
        })
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
        <>
            <TableRow
                hover
                role="row"
                aria-checked={isSelected}
                selected={isSelected}
                onClick={handleRowClick}
                sx={{ cursor: 'pointer' }}
            >
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
                                onClick={(e) => e.stopPropagation()}
                                disabled={loading || isSuperAdmin}
                                inputProps={{ "aria-labelledby": `account-${account.id}` }}
                            />
                        </span>
                    </Tooltip>
                </TableCell>
                <TableCell>{account.title}</TableCell>
                <TableCell>{account.firstName}</TableCell>
                <TableCell>{account.lastName}</TableCell>
                <TableCell>{account.email}</TableCell>
                <TableCell>{account.role}</TableCell>
                <TableCell>
                    {formatDate(account.createdAt)}
                    <Backdrop
                        sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
                        open={isPending}
                    >
                        <CircularProgress color="inherit" />
                    </Backdrop>
                </TableCell>
            </TableRow>
        </>
    )
}
export default AccountRow