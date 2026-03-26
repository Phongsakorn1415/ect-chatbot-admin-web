import { TableRow, TableCell, Checkbox, Chip, Tooltip } from "@mui/material";
import { TableInvitationsProps } from "@/lib/types/invitations";

interface InviteRowProps {
	invite: TableInvitationsProps;
	isSelected: boolean;
	onSelectRow: (id: string) => void;
	loading?: boolean;
	viewerRole?: string;
}

const statusColor = (status: string) => {
	switch (status) {
		case "PENDING":
			return "primary" as const;
		case "ACCEPTED":
			return "success" as const;
		case "EXPIRED":
			return "error" as const;
		case "CANCELLED":
			return "default" as const;
		default:
			return "default" as const;
	}
};

const InviteRow = ({ invite, isSelected, onSelectRow, loading = false, viewerRole }: InviteRowProps) => {
	
	const canManage = viewerRole === 'SUPER_ADMIN' || (viewerRole === 'ADMIN' && invite.role === 'TEACHER');
	const disabledReason = (viewerRole === 'ADMIN' && invite.role !== 'TEACHER') 
		? "Admin สามารถจัดการได้เฉพาะคำเชิญบทบาท Teacher เท่านั้น" 
		: "";

	const handleSelectRow = (event: React.ChangeEvent<HTMLInputElement>) => {
		if (canManage) {
			onSelectRow(invite.id);
		}
	};

	const formatDate = (dateString: string) => {
		const date = new Date(dateString);
		return date.toLocaleDateString("th-TH", {
			year: "numeric",
			month: "long",
			day: "numeric",
		});
	};

	return (
		<TableRow hover role="checkbox" aria-checked={isSelected} selected={isSelected}>
			<TableCell padding="checkbox">
				<Tooltip title={disabledReason} arrow placement="top">
					<span>
						<Checkbox
							checked={isSelected}
							onChange={handleSelectRow}
							disabled={loading || !canManage}
							inputProps={{ "aria-labelledby": `invite-${invite.id}` }}
						/>
					</span>
				</Tooltip>
			</TableCell>
			<TableCell>
				<Chip label={invite.status} color={statusColor(invite.status)} size="small" />
			</TableCell>
			<TableCell sx={{ color: invite.title ? 'text.primary' : 'lightgray' }}>{invite.title || "ยังไม่กำหนด"}</TableCell>
			<TableCell sx={{ color: invite.firstName ? 'text.primary' : 'lightgray' }}>{invite.firstName || "ยังไม่กำหนด"}</TableCell>
			<TableCell sx={{ color: invite.lastName ? 'text.primary' : 'lightgray' }}>{invite.lastName || "ยังไม่กำหนด"}</TableCell>
			<TableCell>{invite.email}</TableCell>
			<TableCell>{invite.role}</TableCell>
			<TableCell>{invite.invitedBy}</TableCell>
			<TableCell>{formatDate(invite.createdAt)}</TableCell>
		</TableRow>
	);
};

export default InviteRow;
