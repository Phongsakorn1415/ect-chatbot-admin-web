'use client'

import React, { useState } from 'react'
import { Box, Button, Grid, Paper, Typography, Menu, MenuItem, Divider } from '@mui/material'
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { Dayjs } from 'dayjs'
import * as XLSX from 'xlsx'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { ChatLog } from '@/lib/components/pageComponent/other/reportedChat/logsSection'

interface FilterSectionProps {
    logs: ChatLog[]
    startDate: Dayjs | null
    setStartDate: React.Dispatch<React.SetStateAction<Dayjs | null>>
    endDate: Dayjs | null
    setEndDate: React.Dispatch<React.SetStateAction<Dayjs | null>>
    onSearch: () => void
    onReset: () => void
    selectedRows: number[]
    onClearSuccess: () => void
}

const FilterSection: React.FC<FilterSectionProps> = ({
    logs,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    onSearch,
    onReset,
    selectedRows,
    onClearSuccess
}) => {
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);

    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleClearData = async () => {
        if (selectedRows.length === 0) {
            alert("กรุณาเลือกข้อมูลที่ต้องการล้าง");
            return;
        }
        if (confirm("คุณแน่ใจหรือไม่ว่าต้องการล้างข้อมูลที่เลือก?")) {
            try {
                const res = await fetch('/api/reported-chat', {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ids: selectedRows })
                });
                if (res.ok) {
                    onClearSuccess();
                } else {
                    alert('เกิดข้อผิดพลาดในการล้างข้อมูล');
                }
            } catch (err) {
                console.error(err);
                alert('เกิดข้อผิดพลาดในการล้างข้อมูล');
            }
        }
    };

    const handleExport = async (type: string, withClear: boolean) => {
        handleClose();
        const exportData = logs.filter(log => selectedRows.includes(log.id));

        if (exportData.length === 0) {
            alert('ไม่พบข้อมูลที่จะ Export');
            return;
        }

        const formattedData = exportData.map(log => ({
            "Report Message": log.reportMessage || '-',
            "Reported At": log.reportedAt ? new Date(log.reportedAt).toLocaleString('th-TH') : '-',
            "User Message": log.userMessage || '-',
            "AI Response": log.aiResponse || '-',
            "Tool Used": log.toolUsed || '-',
            "Tools Arguments": log.toolsArguments || '-',
            "Tool Result": log.toolResult || '-',
            "Chat History": log.chatHistory || '-'
        }));

        if (type === 'xlsx' || type === 'CSV') {
            const worksheet = XLSX.utils.json_to_sheet(formattedData);
            if (type === 'xlsx') {
                const workbook = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(workbook, worksheet, "Reported Chats");
                XLSX.writeFile(workbook, "ReportedChats.xlsx");
            } else {
                const csvOutput = XLSX.utils.sheet_to_csv(worksheet);
                const blob = new Blob(["\uFEFF" + csvOutput], { type: 'text/csv;charset=utf-8;' });
                const link = document.createElement("a");
                const url = URL.createObjectURL(blob);
                link.setAttribute("href", url);
                link.setAttribute("download", "ReportedChats.csv");
                link.style.visibility = 'hidden';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }
        } else if (type === 'PDF') {
            try {
                const doc = new jsPDF() as any;
                
                const fontRes = await fetch('https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/sarabun/Sarabun-Regular.ttf');
                const fontBuffer = await fontRes.arrayBuffer();
                let binary = '';
                const bytes = new Uint8Array(fontBuffer);
                for (let i = 0; i < bytes.byteLength; i++) {
                    binary += String.fromCharCode(bytes[i]);
                }
                const fontBase64 = window.btoa(binary);

                doc.addFileToVFS('Sarabun-Regular.ttf', fontBase64);
                doc.addFont('Sarabun-Regular.ttf', 'Sarabun', 'normal', 'Identity-H');
                doc.setFont('Sarabun');

                const margin = 15;
                const pageWidth = doc.internal.pageSize.getWidth();
                const pageHeight = doc.internal.pageSize.getHeight();
                const maxLineWidth = pageWidth - margin * 2;

                exportData.forEach((log, index) => {
                    if (index > 0) {
                        doc.addPage();
                    }
                    const logStartPage = doc.internal.getNumberOfPages();
                    let y = margin + 18; // Reserve space for the header on every page
                    
                    const printField = (title: string, content: string | null) => {
                        if (y > pageHeight - margin) {
                            doc.addPage();
                            y = margin + 18;
                        }

                        doc.setFontSize(10);
                        doc.setTextColor(120, 120, 120);
                        doc.text(title, margin, y);
                        y += 7; // Increase spacing to prevent background from touching the title

                        doc.setFontSize(12);
                        doc.setTextColor(0, 0, 0);
                        const textToPrint = content || '-';
                        const lines = doc.splitTextToSize(textToPrint, maxLineWidth);

                        for (let i = 0; i < lines.length; i++) {
                            if (y > pageHeight - margin) {
                                doc.addPage();
                                y = margin + 18;
                            }
                            
                            let rectY = y - 5;
                            let rectH = 7; // Use 7 to perfectly overlap 6-unit line spacing with no gaps
                            
                            // Bottom padding for the last line of the block
                            if (i === lines.length - 1 || y + 6 > pageHeight - margin) {
                                rectH += 2;
                            }

                            doc.setFillColor(245, 245, 245);
                            doc.rect(margin - 2, rectY, maxLineWidth + 4, rectH, 'F');

                            doc.setTextColor(0, 0, 0);
                            doc.text(lines[i], margin, y);
                            y += 6;
                        }
                        y += 8; // Extra spacing below the block
                    };

                    printField("Report Message", log.reportMessage);
                    printField("Reported At", log.reportedAt ? new Date(log.reportedAt).toLocaleString('th-TH') : null);
                    printField("User Message", log.userMessage);
                    printField("AI Response", log.aiResponse);
                    printField("Tool Used", log.toolUsed);
                    printField("Tools Arguments", log.toolsArguments);
                    printField("Tool Result", log.toolResult);
                    printField("Chat History", log.chatHistory);

                    const logEndPage = doc.internal.getNumberOfPages();
                    const totalPagesForLog = logEndPage - logStartPage + 1;

                    for (let p = logStartPage; p <= logEndPage; p++) {
                        doc.setPage(p);
                        const pageForLog = p - logStartPage + 1;
                        doc.setFontSize(10);
                        doc.setTextColor(100, 100, 100);
                        const titleText = `ข้อมูลรายการที่ ${index + 1} (หน้า ${pageForLog} / ${totalPagesForLog})`;
                        const textWidth = doc.getTextWidth(titleText);
                        doc.text(titleText, pageWidth - margin - textWidth, margin + 5);
                    }
                    
                    doc.setPage(logEndPage);
                });

                doc.save("ReportedChats.pdf");
            } catch (err) {
                console.error(err);
                alert("เกิดข้อผิดพลาดในการสร้าง PDF");
            }
        }

        if (withClear) {
            handleClearData();
        }
    };

    return (
        <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
                <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <Box>
                            <Typography variant="h6" color="text.primary">
                                วันเริ่มต้น
                            </Typography>
                            <DatePicker
                                sx={{ width: '100%' }}
                                value={startDate}
                                onChange={(newValue) => {
                                    setStartDate(newValue);
                                    if (newValue && endDate && endDate.isBefore(newValue, 'day')) {
                                        setEndDate(null);
                                    }
                                }}
                            />
                        </Box>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <Box>
                            <Typography variant="h6" color="text.primary">
                                วันสิ้นสุด
                            </Typography>
                            <DatePicker
                                sx={{ width: '100%' }}
                                disabled={!startDate}
                                minDate={startDate || undefined}
                                value={endDate}
                                onChange={(newValue) => setEndDate(newValue)}
                            />
                        </Box>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 12, md: 2 }}>
                        <Box>
                            <Typography variant="h6" sx={{ visibility: 'hidden', display: { xs: 'none', md: 'block' } }}>
                                -
                            </Typography>
                            <Button
                                variant="outlined"
                                color="primary"
                                sx={{ width: '100%', height: { xs: 'auto', md: '56px' }, fontSize: '1.2rem' }}
                                onClick={onSearch}
                            >
                                ค้นหา
                            </Button>
                        </Box>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 12, md: 2 }}>
                        <Box>
                            <Typography variant="h6" sx={{ visibility: 'hidden', display: { xs: 'none', md: 'block' } }}>
                                -
                            </Typography>
                            <Button
                                variant="outlined"
                                color="warning"
                                sx={{ width: '100%', height: { xs: 'auto', md: '56px' } }}
                                onClick={onReset}
                            >
                                reset
                            </Button>
                        </Box>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 12, md: 12 }} sx={{ display: { xs: 'block', md: 'none' }, color: 'divider' }} border={{ xs: 1, md: 0 }}>
                        <Divider />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 12, md: 6 }}>
                        <Button
                            variant="outlined"
                            color="error"
                            sx={{ width: '100%', height: 'auto', fontSize: '1.2rem' }}
                            onClick={handleClearData}
                            disabled={selectedRows.length === 0}
                        >
                            ล้างประวัติ {selectedRows.length > 0 && `(${selectedRows.length})`}
                        </Button>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 12, md: 6 }}>
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={handleClick}
                            endIcon={<KeyboardArrowDownIcon />}
                            sx={{ width: '100%', height: 'auto', fontSize: '1.2rem' }}
                            disabled={selectedRows.length === 0}
                        >
                            Export {selectedRows.length > 0 && `(${selectedRows.length})`}
                        </Button>
                        <Menu
                            anchorEl={anchorEl}
                            open={open}
                            onClose={handleClose}
                            PaperProps={{
                                style: { width: anchorEl ? anchorEl.clientWidth : undefined },
                            }}
                        >
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                <MenuItem onClick={() => handleExport('xlsx', false)}>Export เป็น xlsx</MenuItem>
                                <MenuItem onClick={() => handleExport('PDF', false)}>Export เป็น PDF</MenuItem>
                                <MenuItem onClick={() => handleExport('CSV', false)}>Export เป็น CSV</MenuItem>
                            </Box>
                            <Divider sx={{ my: 1, mx: 1 }} />
                            <Box sx={{ color: 'red', display: 'flex', flexDirection: 'column', gap: 1 }}>
                                <MenuItem onClick={() => handleExport('xlsx', true)}>Export เป็น xlsx พร้อมล้างประวัติ</MenuItem>
                                <MenuItem onClick={() => handleExport('PDF', true)}>Export เป็น PDF พร้อมล้างประวัติ</MenuItem>
                                <MenuItem onClick={() => handleExport('CSV', true)}>Export เป็น CSV พร้อมล้างประวัติ</MenuItem>
                            </Box>
                        </Menu>
                    </Grid>
                </Grid>
            </Paper>
        </LocalizationProvider >
    )
}

export default FilterSection