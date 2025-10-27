import React from "react";
import { capitalize, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from "@mui/material";
import { Subject } from "@/lib/types/subject";

type Props = {
    subjects: Subject[] | null;
    loading?: boolean;
};

const SubjectTable: React.FC<Props> = ({ subjects, loading = false }) => {
    return (
        <>
            <TableContainer>
                <Table stickyHeader>
                    <TableHead>
                        <TableRow>
                            <TableCell>ชื่อวิชา</TableCell>
                            <TableCell>หน่วยกิต</TableCell>
                            <TableCell>สอนด้วยภาษา</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {(() => {
                            if (loading) {
                                return (
                                    <TableRow>
                                        <TableCell colSpan={4} align="center">กำลังโหลด...</TableCell>
                                    </TableRow>
                                );
                            }
                            if (!subjects) {
                                // not loaded yet
                                return (
                                    <TableRow>
                                        <TableCell colSpan={4} align="center">ไม่มีข้อมูลวิชา</TableCell>
                                    </TableRow>
                                );
                            }
                            if (Array.isArray(subjects) && subjects.length > 0) {
                                return subjects.map((subject) => (
                                    <TableRow key={subject.id}>
                                        <TableCell>{subject.name ?? '-'}</TableCell>
                                        <TableCell>{subject.credit ?? '-'}</TableCell>
                                        <TableCell>{capitalize(subject.language as string) ?? '-'}</TableCell>
                                    </TableRow>
                                ));
                            }
                            return (
                                <TableRow>
                                    <TableCell colSpan={4} align="center">ไม่มีข้อมูลวิชา</TableCell>
                                </TableRow>
                            );
                        })()}
                    </TableBody>
                </Table>
            </TableContainer>
        </>
    );
};
export default SubjectTable;