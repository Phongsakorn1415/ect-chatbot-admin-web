import { createTheme } from '@mui/material'

const MainTheme = createTheme({
    palette: {
        primary: { main: '#1976d2' },
        secondary: { main: '#135ba3ff' },
        text: { primary: '#000000', secondary: '#ffffff' }
    },
    // breakpoints: {
    //     values: {
    //         xs: 0,
    //         sm: 600,
    //         md: 900,
    //         lg: 1200,
    //         xl: 1536,
    //     },
    // },
})

export default MainTheme
