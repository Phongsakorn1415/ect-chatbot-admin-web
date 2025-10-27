import { createTheme } from '@mui/material'
import createTextFieldOverrides from './override/textfield'
import createTabOverrides from './override/Tab'
import createRadioOverrides from './override/radioButton'

// Base theme for palette definitions
const baseTheme = createTheme({
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

// Extend theme by composing overrides from separate files
const MainTheme = createTheme(baseTheme, {
    components: {
        ...createTextFieldOverrides(baseTheme),
        ...createTabOverrides(baseTheme),
        ...createRadioOverrides(baseTheme),
    },
})

export default MainTheme
