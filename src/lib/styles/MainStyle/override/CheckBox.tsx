import { Theme } from '@mui/material/styles';

// Centralized Checkbox component overrides
// - Unchecked: gray icon
// - Checked: primary color
const createCheckBoxOverrides = (theme: Theme) => ({
	MuiCheckbox: {
		styleOverrides: {
			root: {
				// Default (unchecked) icon color
				color: theme.palette.grey[500],

				// Checked state icon color
				'&.Mui-checked': {
					color: theme.palette.primary.main,
				},

				// Disabled state
				'&.Mui-disabled': {
					color: theme.palette.action.disabled,
				},
			},
		},
	},
});

export default createCheckBoxOverrides;

