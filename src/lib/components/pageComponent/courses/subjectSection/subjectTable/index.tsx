import React, { useEffect } from "react";
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from "@mui/material";
import { Subject } from "@/lib/types/subject";

const SubjectTable = ({ SemesterId }: { SemesterId: number }) => {
    // Simplify to a single list and loading flag since the API returns subjects for one term at a time
    const [subjects, setSubjects] = React.useState<Subject[] | null>(null);
    const [loading, setLoading] = React.useState<boolean>(false);

    useEffect(() => {
        const fetchSubjects = async () => {
            if (!SemesterId) return;
            setLoading(true);
            try {
                const response = await fetch(`/api/course/education-sector/${SemesterId}/subject`);
                const data = await response.json();
                const list: Subject[] = Array.isArray(data?.data) ? data.data : [];
                setSubjects(list);
            } catch (error) {
                console.error("Failed to fetch subjects:", error);
                setSubjects([]);
            } finally {
                setLoading(false);
            }
        };
        fetchSubjects();
    }, [SemesterId]);

    return (
        <>
            <TableContainer>
                <Table stickyHeader>
                    <TableHead>
                        <TableRow>
                            <TableCell>ชื่อวิชา</TableCell>
                            <TableCell>หน่วยกิต</TableCell>
                            <TableCell>ภาษา</TableCell>
                            <TableCell>ประเภท</TableCell>
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
                                        <TableCell>{subject.language ?? '-'}</TableCell>
                                        <TableCell>{subject.isRequire ? 'บังคับ' : 'เลือก'}</TableCell>
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