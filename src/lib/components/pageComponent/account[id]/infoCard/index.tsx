import React, { useEffect, useState } from "react"
import { Box, Paper, Tab, Tabs } from "@mui/material"

import { ContactInfo } from "@/lib/types/contact"

import ContactSection from "./contactSection"
import TeachSection from "./teachSection"

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

function CustomTabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`simple-tabpanel-${index}`}
            aria-labelledby={`simple-tab-${index}`}
            {...other}
        >
            {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
        </div>
    );
}

function a11yProps(index: number) {
    return {
        id: `simple-tab-${index}`,
        'aria-controls': `simple-tabpanel-${index}`,
    };
}

const InfoCard = ({ userRole, contactData }: { userRole: string, contactData?: ContactInfo[] }) => {
    const [TabValue, setTabValue] = useState(0);

    return (
        <>
            <Paper elevation={3} sx={{ p: 2 }}>
                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                    <Tabs value={TabValue} onChange={(event, newValue) => setTabValue(newValue)} aria-label="basic tabs example">
                        <Tab label="ช่องทางติดต่อ" {...a11yProps(0)} />
                        {userRole === 'TEACHER' && <Tab label="ข้อมูลการสอน" {...a11yProps(1)} />}
                    </Tabs>
                </Box>
                <CustomTabPanel value={TabValue} index={0}>
                    <ContactSection
                        contactData={contactData ?? []}
                    />
                </CustomTabPanel>
                {userRole === 'TEACHER' && (
                    <CustomTabPanel value={TabValue} index={1}>
                        <TeachSection />
                    </CustomTabPanel>
                )}
            </Paper>
        </>
    )
}
export default InfoCard