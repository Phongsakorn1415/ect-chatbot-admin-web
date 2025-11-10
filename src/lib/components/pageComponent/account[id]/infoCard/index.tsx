import React, { useEffect, useState } from "react"
import { Box, Paper, Tab, Tabs } from "@mui/material"

import { ContactInfo } from "@/lib/types/contact"

import ContactSection from "./contactSection"
import TeachSection from "./teachSection"
import { CustomTabPanel, a11yProps } from "@/lib/components/TabsProvider"

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