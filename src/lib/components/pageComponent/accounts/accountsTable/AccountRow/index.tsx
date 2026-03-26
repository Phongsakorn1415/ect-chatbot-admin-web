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
    viewerRole?: string;
}

const AccountRow = ({ account, isSelected, onSelectRow, loading = false, viewerRole }: AccountRowProps) => {
    const router = useRouter();
    const { data: session } = useSession();
    
    // Logic: 
    // SuperAdmin can be selected only by SuperAdmin (but usually not even then if it's the main root, let's stick to the rule: SuperAdmin is untouchable by Admin)
    // Admin can ONLY select Teacher.
    // SuperAdmin can select any (except maybe other SuperAdmins if we want to be strict, but let's allow SuperAdmin to manage all).
    
    const isSuperAdmin = account.role === 'SUPER_ADMIN';
    const isAdmin = account.role === 'ADMIN';
    
    let canManage = false;
    let disabledReason = "";

    if (viewerRole === 'SUPER_ADMIN') {
        canManage = true;
    } else if (viewerRole === 'ADMIN') {
        if (account.role === 'TEACHER') {
            canManage = true;
        } else {
            canManage = false;
            disabledReason = "Admin สามารถจัดการได้เฉพาะบัญชี Teacher เท่านั้น";
        }
    }

    if (isSuperAdmin && viewerRole !== 'SUPER_ADMIN') {
        disabledReason = "ไม่สามารถจัดการบัญชี Super Admin ได้";
    }

    const [isPending, startTransition] = useTransition();

    const handleSelectRow = (event: React.ChangeEvent<HTMLInputElement>) => {
        event.stopPropagation();
        if (canManage) {
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
                    title={!canManage ? disabledReason : ""}
                    arrow
                    placement="top"
                >
                    <span>
                        <Checkbox
                            checked={isSelected}
                            onChange={handleSelectRow}
                            onClick={(e) => e.stopPropagation()}
                            disabled={loading || !canManage}
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
    )
}
export default AccountRow