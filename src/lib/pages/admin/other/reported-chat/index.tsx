'use client'

import React, { useState, useEffect } from 'react'
import { Box, Typography } from '@mui/material'
import FilterSection from '@/lib/components/pageComponent/other/reportedChat/filterSection'
import LogsSection, { ChatLog } from '@/lib/components/pageComponent/other/reportedChat/logsSection'
import { Dayjs } from 'dayjs'

const ReportedChatPage = () => {
  const [startDate, setStartDate] = useState<Dayjs | null>(null)
  const [endDate, setEndDate] = useState<Dayjs | null>(null)
  const [searchDates, setSearchDates] = useState<{ startDate: string | null; endDate: string | null }>({
    startDate: null,
    endDate: null,
  })
  const [selectedRows, setSelectedRows] = useState<number[]>([])
  const [refreshKey, setRefreshKey] = useState(0)
  
  const [logs, setLogs] = useState<ChatLog[]>([])
  const [loadingLogs, setLoadingLogs] = useState(false)

  useEffect(() => {
      const fetchLogs = async () => {
          setLoadingLogs(true)
          try {
              const params = new URLSearchParams()
              if (searchDates.startDate) params.append('startDate', searchDates.startDate)
              if (searchDates.endDate) params.append('endDate', searchDates.endDate)

              const res = await fetch(`/api/reported-chat?${params.toString()}`)
              if (res.ok) {
                  const data = await res.json()
                  setLogs(data)
              }
          } catch (err) {
              console.error('Error fetching logs:', err)
          } finally {
              setLoadingLogs(false)
          }
      }
      fetchLogs()
  }, [searchDates, refreshKey])

  const handleSearch = () => {
    setSearchDates({
      startDate: startDate ? startDate.toISOString() : null,
      endDate: endDate ? endDate.toISOString() : null,
    })
    setSelectedRows([])
  }

  const handleReset = () => {
    setStartDate(null)
    setEndDate(null)
    setSearchDates({
      startDate: null,
      endDate: null,
    })
    setSelectedRows([])
  }

  const triggerRefresh = () => {
    setRefreshKey((prev) => prev + 1)
    setSelectedRows([])
  }

  return (
    <Box sx={{ m: { xs: 1, md: 3 }, display: 'flex', flexDirection: 'column', gap: { xs: 2, md: 3 } }}>
      <Typography variant="h4" gutterBottom>
        ประวัติการสนทนา
      </Typography>
      <FilterSection 
        logs={logs}
        startDate={startDate}
        setStartDate={setStartDate}
        endDate={endDate}
        setEndDate={setEndDate}
        onSearch={handleSearch}
        onReset={handleReset}
        selectedRows={selectedRows}
        onClearSuccess={triggerRefresh}
      />
      <LogsSection 
        logs={logs}
        loading={loadingLogs}
        searchDates={searchDates}
        selectedRows={selectedRows}
        setSelectedRows={setSelectedRows}
        refreshKey={refreshKey}
      />
    </Box>
  )
}

export default ReportedChatPage
