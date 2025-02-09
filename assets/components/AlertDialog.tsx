import * as React from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import { Link } from '@mui/material';

export default function AlertDialog(props: any) {
	const { open, optIn, optOut } = props;

	return (
		<React.Fragment>
			<Dialog
				open={open}
			>
				<DialogTitle>NEW UPDATE !</DialogTitle>
				<DialogContent>
					<DialogContentText sx={{ textAlign: 'justify' }}>
						✨ We are excited to announce the dark mode feature, as well as a new feature that will help us keep the service free and available. ✨
					</DialogContentText>
				</DialogContent>
			</Dialog>
		</React.Fragment>
	);
}
