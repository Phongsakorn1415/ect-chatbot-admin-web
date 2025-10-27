"use client";

import React from "react";
import {
    Box,
    Tab,
    Tabs,
    Typography,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Button,
    Radio,
    RadioGroup,
    FormControlLabel,
    FormControl,
    FormLabel,
    Stack,
    TableContainer,
    Table,
    TableHead,
    TableRow,
    TableCell,
    TableBody,
} from "@mui/material";
import AddIcon from '@mui/icons-material/Add';
import { educationSector } from "@/lib/types/course-year";
import { Subject } from "@/lib/types/subject";
import SubjectTable from "./subjectTable";
import CustomAlert from "@/lib/components/customAlert";

type TabPanelProps = {
    children?: React.ReactNode;
    index: number;
    value: number;
};

function CustomTabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`subject-tabpanel-${index}`}
            aria-labelledby={`subject-tab-${index}`}
            {...other}
        >
            {value === index && (
                <Box sx={{ p: 2 }}>
                    {children}
                </Box>
            )}
        </div>
    );
}

function a11yProps(index: number) {
    return {
        id: `subject-tab-${index}`,
        "aria-controls": `subject-tabpanel-${index}`,
    } as const;
}

// Using shared Subject type from src/lib/types/subject

const SubjectSection: React.FC<{ courseYearId: number | null }> = ({ courseYearId }) => {
    const [value, setValue] = React.useState(0);
    const [allSemesters, setAllSemesters] = React.useState<educationSector[]>([]);
    const [subjectsMap, setSubjectsMap] = React.useState<Record<number, Subject[]>>({});
    const [subjectsLoading, setSubjectsLoading] = React.useState<Record<number, boolean>>({});
    const [electiveSubjects, setElectiveSubjects] = React.useState<Subject[] | null>(null);
    const [electiveLoading, setElectiveLoading] = React.useState<boolean>(false);
    const [courseSubjects, setCourseSubjects] = React.useState<Subject[] | null>(null);
    const [courseSubjectsLoading, setCourseSubjectsLoading] = React.useState<boolean>(false);

    // Modal state
    const [openAdd, setOpenAdd] = React.useState(false);
    const [yearInput, setYearInput] = React.useState<number | "">("");
    const [semesterMode, setSemesterMode] = React.useState<"number" | "summer">("number");
    const [semesterInput, setSemesterInput] = React.useState<number | "">("");
    const [submitting, setSubmitting] = React.useState(false);

    // Alert state (using CustomAlert)
    const [alertOpen, setAlertOpen] = React.useState(false);
    const [alertMessage, setAlertMessage] = React.useState("");
    const [alertSeverity, setAlertSeverity] = React.useState<'error' | 'warning' | 'info' | 'success'>("info");
    const alertTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

    const showAlert = (message: string, severity: 'error' | 'warning' | 'info' | 'success' = 'info', duration = 4000) => {
        // clear any existing timer
        if (alertTimerRef.current) {
            clearTimeout(alertTimerRef.current as unknown as number);
            alertTimerRef.current = null;
        }
        setAlertMessage(message);
        setAlertSeverity(severity);
        setAlertOpen(true);
        alertTimerRef.current = setTimeout(() => {
            setAlertOpen(false);
            alertTimerRef.current = null;
        }, duration);
    };

    const fetchSemesters = React.useCallback(async (): Promise<educationSector[]> => {
        // Guard: don't call API if courseYearId is not ready
        if (courseYearId == null || Number.isNaN(Number(courseYearId))) {
            setAllSemesters([]);
            return [];
        }
        try {
            const response = await fetch(`/api/course/course-year/${courseYearId}/sector`);
            const json = await response.json();
            // API returns { data: educationSector[] }, but be defensive
            const semesters: educationSector[] = Array.isArray(json)
                ? json
                : (Array.isArray(json?.data) ? json.data : []);
            setAllSemesters(semesters);
            return semesters;
        } catch (error) {
            console.error("Error fetching semesters:", error);
            setAllSemesters([]);
            return [];
        }
    }, [courseYearId]);

    // Fetch all subjects once by course year, then filter per sector/elective
    const fetchCourseYearSubjects = React.useCallback(async () => {
        if (courseYearId == null || Number.isNaN(Number(courseYearId))) {
            setCourseSubjects([]);
            setCourseSubjectsLoading(false);
            return [] as Subject[];
        }
        try {
            setCourseSubjectsLoading(true);
            const res = await fetch(`/api/course/course-year/${courseYearId}/subject`);
            const json = await res.json();
            const subs: Subject[] = Array.isArray(json) ? json : (Array.isArray(json?.data) ? json.data : []);
            setCourseSubjects(subs);
            return subs;
        } catch (err) {
            console.error('Error fetching course year subjects', err);
            setCourseSubjects([]);
            return [] as Subject[];
        } finally {
            setCourseSubjectsLoading(false);
        }
    }, [courseYearId]);

    React.useEffect(() => {
        // When courseYearId changes, reset per-sector caches to avoid stale data
        setSubjectsMap({});
        setSubjectsLoading({});
        setElectiveSubjects(null);
        setElectiveLoading(false);
        // Reset tab to the first tab to avoid out-of-range selection when switching course year
        setValue(0);
        // Fetch all semesters and all subjects for the course year (guarded inside)
        fetchSemesters();
        fetchCourseYearSubjects();
    }, [fetchSemesters, fetchCourseYearSubjects]);

    // When semesters or course subjects change, map subjects to each sector and set per-sector loading
    React.useEffect(() => {
        const sectors = Array.isArray(allSemesters) ? allSemesters : [];
        if (sectors.length === 0) {
            setSubjectsMap({});
            setSubjectsLoading({});
            return;
        }
        const map: Record<number, Subject[]> = {};
        const loadingMap: Record<number, boolean> = {};
        sectors.forEach(s => {
            map[s.id] = (courseSubjects || []).filter(sub => sub.education_sectorId === s.id);
            loadingMap[s.id] = !!courseSubjectsLoading; 
        });
        setSubjectsMap(map);
        setSubjectsLoading(loadingMap);
    }, [allSemesters, courseSubjects, courseSubjectsLoading]);

    const handleChange = (_event: React.SyntheticEvent, newValue: number) => {
        // If clicking the add tab (last tab), open modal and keep current selection
        if (newValue === allSemesters.length+1) {
            setOpenAdd(true);
            return;
        }
        setValue(newValue);
    };

    // Derive electives from courseSubjects
    React.useEffect(() => {
        setElectiveLoading(!!courseSubjectsLoading);
        if (!courseSubjects) {
            setElectiveSubjects(null);
            return;
        }
        const electives = courseSubjects.filter(s => s?.isRequire === false);
        setElectiveSubjects(electives);
    }, [courseSubjects, courseSubjectsLoading]);

    // Keep tab index within available bounds whenever semesters change
    React.useEffect(() => {
        const maxSelectableIndex = (Array.isArray(allSemesters) ? allSemesters.length : 0) + 1; // includes elective and add tabs
        if (value > maxSelectableIndex) {
            setValue(0);
        }
    }, [allSemesters, value]);

    const resetForm = () => {
        setYearInput("");
        setSemesterMode("number");
        setSemesterInput("");
    };

    const handleClose = () => {
        if (!submitting) {
            setOpenAdd(false);
            resetForm();
        }
    };

    const isValidYear = (v: number | "") => typeof v === "number" && v >= 1;
    const isValidSemesterNumber = (v: number | "") => typeof v === "number" && v >= 1;

    const handleSubmit = async () => {
        if (courseYearId == null) {
            showAlert("กรุณาเลือกหลักสูตรก่อนเพิ่มภาคการศึกษา", 'warning');
            return;
        }
        const year = typeof yearInput === "number" ? yearInput : NaN;
        const semester = semesterMode === "summer"
            ? 0
            : (typeof semesterInput === "number" ? semesterInput : NaN);

        if (!isValidYear(year) || (semesterMode === "number" && !isValidSemesterNumber(semester))) {
            // Very simple feedback
            showAlert("กรุณากรอกข้อมูลให้ถูกต้อง: ปีการศึกษาและภาคการศึกษา (ตัวเลขต้องมากกว่าหรือเท่ากับ 1)", 'warning');
            return;
        }

        // Prevent duplicate: same year and semester already exists in current list
        const hasDuplicate = (Array.isArray(allSemesters) ? allSemesters : [])
            .some(s => s.year === year && s.semester === semester);
        if (hasDuplicate) {
            showAlert("ภาคการศึกษาปีและภาคการเรียนนี้มีอยู่แล้ว", 'warning');
            return;
        }

        try {
            const confirm = window.confirm("คุณแน่ใจหรือไม่ว่าต้องการบันทึกการแก้ไข?");
            if (!confirm) return;
            setSubmitting(true);
            const res = await fetch(`/api/course/course-year/${courseYearId}/sector`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ year, semester }),
            });

            if (!res.ok) {
                // Try to extract message from JSON; fallback to plain text
                let errMsg = "สร้างภาคการศึกษาไม่สำเร็จ";
                try {
                    const data = await res.json();
                    errMsg = data?.message || errMsg;
                } catch (_jsonErr) {
                    try {
                        const text = await res.text();
                        errMsg = text || errMsg;
                    } catch {
                        // ignore
                    }
                }
                throw new Error(errMsg);
            }

            const json = await res.json();
            const created: educationSector | undefined = json?.data;

            // Refresh list and select newly created sector tab if possible
            const semesters = await fetchSemesters();
            if (created) {
                const idx = semesters.findIndex(s => s.id === created.id);
                if (idx >= 0) setValue(idx);
            }

            setOpenAdd(false);
            resetForm();
        } catch (e) {
            console.error(e);
            const message = e instanceof Error && e.message ? e.message : "เกิดข้อผิดพลาดในการสร้างภาคการศึกษา";
            showAlert(message, 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (sectorId: number) => {
        const confirm = window.confirm("คุณแน่ใจหรือไม่ว่าต้องการลบภาคการศึกษานี้? การกระทำนี้ไม่สามารถย้อนกลับได้");
        if (!confirm) return;
        try {
            const res = await fetch(`/api/course/education-sector/${sectorId}`, {
                method: "DELETE",
            });
            if (!res.ok) {
                const msg = await res.text();
                throw new Error(msg || "ลบภาคการศึกษาไม่สำเร็จ");
            }
            // Refresh list or update state as needed
            const semesters = await fetchSemesters();
            // If the deleted sector was selected, reset selection
            if (semesters.length === 0) {
                setValue(0);
            } else if (value >= semesters.length) {
                setValue(semesters.length - 1);
            }
        } catch (e) {
            console.error(e);
            showAlert("เกิดข้อผิดพลาดในการลบภาคการศึกษา", 'error');
        }
    };

    return (
        <>
            <Typography sx={{ mt: 2, mb: 1, fontSize: "175%", textAlign: "left" }}>
                วิชาที่เปิดสอน
            </Typography>
            <Button variant="outlined" onClick={() => setOpenAdd(true)}>เพิ่มวิชา</Button>
            <Box sx={{ width: "100%" }}>
                <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
                    <Tabs
                        value={value}
                        onChange={handleChange}
                        aria-label="tabs วิชาที่เปิดสอน"
                        variant="scrollable"
                        scrollButtons="auto"
                    // allowScrollButtonsMobile
                    >
                        {
                            (Array.isArray(allSemesters) ? allSemesters : []).map((sector, index) => (
                                <Tab
                                    key={sector.id}
                                    label={`ปี ${sector.year} ${sector.semester !== 0 ? `ภาคการเรียนที่ ${sector.semester}` : "ภาคฤดูร้อน"}`}
                                    {...a11yProps(index)}
                                />
                            ))
                        }
                        <Tab
                            label={'วิชาเลือก'}
                            aria-label="วิชาเลือก"
                            {...a11yProps(allSemesters.length)}
                        />
                        <Tab
                            icon={<AddIcon />}
                            sx={{ color: 'black' }}
                            aria-label="เพิ่มภาคการศึกษา"
                            {...a11yProps(allSemesters.length+1)}
                        />
                    </Tabs>
                </Box>
                {
                    (Array.isArray(allSemesters) ? allSemesters : []).map((sector, index) => (
                        <CustomTabPanel key={sector.id} value={value} index={index}>
                            {/* <Box sx={{ display: 'inline-block', gap: 2 }}>
                                <Button variant="outlined" color="error" onClick={() => handleDelete(sector.id)} sx={{ mb: 2 }}>ลบภาคการศึกษานี้</Button>
                                <Typography>รายการวิชา (Mockup): ปี {sector.year} {sector.semester !== 0 ? `ภาคการเรียนที่ ${sector.semester}` : "ภาคฤดูร้อน"}</Typography>
                            </Box> */}
                            <Typography sx={{ mb: 2, fontSize: "125%", alignContent: "center" }}>
                                รายการวิชา: ปี {sector.year} {sector.semester !== 0 ? `ภาคการเรียนที่ ${sector.semester}` : "ภาคฤดูร้อน"}
                                <Button variant="outlined" color="error" onClick={() => handleDelete(sector.id)} sx={{ mb: 2, ml: 2 }}>ลบภาคการศึกษานี้</Button>
                            </Typography>

                            <Box sx={{ width: '100%', overflow: 'hidden' }}>
                                <SubjectTable subjects={subjectsMap[sector.id] ?? null} loading={subjectsLoading[sector.id] ?? false} />
                            </Box>

                        </CustomTabPanel>
                    ))
                }
                {/* Elective subjects tab panel */}
                <CustomTabPanel key="elective" value={value} index={(Array.isArray(allSemesters) ? allSemesters : []).length}>
                    <Typography sx={{ mb: 2, fontSize: "125%", alignContent: "center" }}>
                        รายการวิชาเลือก
                    </Typography>
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
                                    if (electiveLoading) {
                                        return (
                                            <TableRow>
                                                <TableCell colSpan={3} align="center">กำลังโหลด...</TableCell>
                                            </TableRow>
                                        );
                                    }
                                    if (!electiveSubjects) {
                                        return (
                                            <TableRow>
                                                <TableCell colSpan={3} align="center">ไม่มีข้อมูลวิชา</TableCell>
                                            </TableRow>
                                        );
                                    }
                                    if (Array.isArray(electiveSubjects) && electiveSubjects.length > 0) {
                                        return electiveSubjects.map((subject) => (
                                            <TableRow key={subject.id}>
                                                <TableCell>{subject.name ?? '-'}</TableCell>
                                                <TableCell>{subject.credit ?? '-'}</TableCell>
                                                <TableCell>{subject.language ?? '-'}</TableCell>
                                            </TableRow>
                                        ));
                                    }
                                    return (
                                        <TableRow>
                                            <TableCell colSpan={3} align="center">ไม่มีข้อมูลวิชา</TableCell>
                                        </TableRow>
                                    );
                                })()}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </CustomTabPanel>
            </Box>

            {/* Add Sector Modal */}
            <Dialog open={openAdd} onClose={handleClose} fullWidth maxWidth="sm">
                <DialogTitle>เพิ่มภาคการศึกษา</DialogTitle>
                <DialogContent dividers>
                    <Stack spacing={2} sx={{ mt: 1 }}>
                        <Typography sx={{ color: "primary.main", fontSize: "125%", mb: 1 }}>
                            ปีการศึกษา *
                        </Typography>
                        <TextField
                            type="number"
                            value={yearInput}
                            onChange={(e) => setYearInput(e.target.value === "" ? "" : Number(e.target.value))}
                            inputProps={{ min: 1 }}
                            required
                            fullWidth
                        />

                        <FormControl sx={{ width: '100%' }}>
                            <FormLabel sx={{ color: "primary.main", fontSize: "125%", mb: 1 }}>ภาคการศึกษา *</FormLabel>
                            <RadioGroup
                                value={semesterMode}
                                onChange={(e) => setSemesterMode(e.target.value as "number" | "summer")}
                                sx={{ alignItems: "flex-start", gap: 2, ml: 1, width: '100%' }}
                            >
                                <FormControlLabel
                                    value="number"
                                    control={<Radio />}
                                    sx={{ width: '100%' }}
                                    label={
                                        <Box sx={{ flex: 1, width: '100%' }}>
                                            <TextField
                                                // label="ภาคการเรียนที่"
                                                type="number"
                                                value={semesterInput}
                                                onChange={(e) => setSemesterInput(e.target.value === "" ? "" : Number(e.target.value))}
                                                inputProps={{ min: 1 }}
                                                required={semesterMode === "number"}
                                                disabled={semesterMode !== "number"}
                                                fullWidth
                                            />
                                        </Box>
                                    }
                                />
                                <FormControlLabel value="summer" control={<Radio />} label="ภาคฤดูร้อน" />
                            </RadioGroup>
                        </FormControl>

                        {/* {semesterMode === "number" && (
                            
                        )} */}
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose} disabled={submitting}>
                        ยกเลิก
                    </Button>
                    <Button onClick={handleSubmit} variant="contained" disabled={submitting}>
                        บันทึก
                    </Button>
                </DialogActions>
            </Dialog>
            {alertOpen && (
                <CustomAlert message={alertMessage} severity={alertSeverity} />
            )}
        </>
    );
};

export default SubjectSection;