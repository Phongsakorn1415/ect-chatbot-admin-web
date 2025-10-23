import { Theme } from '@mui/material/styles';

// Centralized TextField-related component overrides
const createTextFieldOverrides = (theme: Theme) => ({
  // Defaults for every TextField
  MuiTextField: {
    defaultProps: {
      variant: 'outlined',
    },
  },

  // Outlined border, hover, focus, and input color
//   MuiOutlinedInput: {
//     styleOverrides: {
//       root: {
//         '& .MuiOutlinedInput-notchedOutline': {
//           borderColor: theme.palette.secondary.main,
//         },
//         '&:hover .MuiOutlinedInput-notchedOutline': {
//           borderColor: theme.palette.secondary.main,
//         },
//         '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
//           borderColor: theme.palette.secondary.main,
//           borderWidth: '2px',
//         },
//       },
//       input: {
//         color: theme.palette.secondary.main,
//       },
//     },
//   },

  // Label color (normal and focused)
  MuiInputLabel: {
    styleOverrides: {
      root: {
        color: theme.palette.secondary.main,
        '&.Mui-focused': {
          color: theme.palette.secondary.main,
        },
      },
    },
  },

  // Helper text color
  MuiFormHelperText: {
    styleOverrides: {
      root: {
        color: theme.palette.secondary.main,
      },
    },
  },
});

export default createTextFieldOverrides;
