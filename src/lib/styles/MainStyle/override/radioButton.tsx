import { Theme } from '@mui/material/styles';

// Centralized Radio component overrides
// - Unselected radios use a gray icon and label
// - Selected radios use the primary color and label switches to text primary
const createRadioOverrides = (theme: Theme) => ({
	MuiRadio: {
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

	// Adjust label color inside FormControlLabel depending on checked state
	MuiFormControlLabel: {
		styleOverrides: {
			root: {
				// Default label color (when not selected)
				'& .MuiFormControlLabel-label': {
					color: theme.palette.grey[600],
				},

				// When the inner Radio is checked, make the label primary text color
				'& .MuiRadio-root.Mui-checked + .MuiFormControlLabel-label': {
					color: theme.palette.text.primary,
				},

				// Disabled state label
				'& .MuiRadio-root.Mui-disabled + .MuiFormControlLabel-label': {
					color: theme.palette.action.disabled,
				},
			},
		},
	},
});

export default createRadioOverrides;

