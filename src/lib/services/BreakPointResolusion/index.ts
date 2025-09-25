'use client'

import { useEffect, useState } from 'react'
import MainTheme from '@/lib/styles/MainStyle'

type BreakpointResult = {
    isMobile: boolean
    isTablet: boolean
    isDesktop: boolean
    width: number
    // เพิ่มสถานะใหม่
    isMounted: boolean
}

// Hook: useBreakPointResolution
// Returns the current width, three booleans for breakpoints, and a flag indicating if it's mounted.
const useBreakPointResolution = (): BreakpointResult => {
    const isClient = typeof window !== 'undefined'
    // 1. ตั้งค่าเริ่มต้น width เป็น 0 เสมอใน SSR
    const [width, setWidth] = useState<number>(0)
    // 2. สถานะใหม่: isMounted จะเป็น true เมื่อ useEffect ทำงาน (บน Client เท่านั้น)
    const [isMounted, setIsMounted] = useState<boolean>(false) 

    useEffect(() => {
        if (!isClient) return
        
        const handleResize = () => setWidth(window.innerWidth)
        
        // 3. ตั้งค่า width เริ่มต้น และ isMounted เป็น true ทันทีที่ Hook ถูก Mount บน Client
        setWidth(window.innerWidth)
        setIsMounted(true) 
        
        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [isClient])

    // ใช้ค่า width ปัจจุบันในการคำนวณ breakpoints
    const isMobile = width <= MainTheme.breakpoints.values.sm
    const isTablet = width > MainTheme.breakpoints.values.sm && width <= MainTheme.breakpoints.values.md
    const isDesktop = width > MainTheme.breakpoints.values.md

    return { isMobile, isTablet, isDesktop, width, isMounted }
}

export default useBreakPointResolution