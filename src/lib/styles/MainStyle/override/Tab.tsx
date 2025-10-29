import { Theme } from '@mui/material/styles';

// Centralized Tab component overrides
// - Unselected tabs use a gray (disabled) text color
// - Selected tabs use the primary text color
const createTabOverrides = (theme: Theme) => ({
	MuiTab: {
		styleOverrides: {
					root: {
						// Default (unselected) state
						color: theme.palette.grey[600],

				// Selected state
				'&.Mui-selected': {
					color: theme.palette.text.primary,
				},

				// Ensure adequate contrast when disabled
						'&.Mui-disabled': {
							color: theme.palette.action.disabled,
						},
			},
		},
	},
});

export default createTabOverrides;

