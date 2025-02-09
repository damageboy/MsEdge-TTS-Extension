import AlertDialog from "@/assets/components/AlertDialog";
import { Box, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import IosSwitch from "@/assets/components/IosSwitch";
import { storage } from "wxt/storage";
const CONFIGURATION_KEY = "YzQ3ODQ0Yjg=";

function App() {
	const [dialogOpen, setDialogOpen] = useState(false);
	const [switchChecked, setSwitchChecked] = useState(false);

	const disclaimerShown = storage.defineItem<boolean>("local:disclaimerShown", { defaultValue: false });

	const handleOpen = () => {
		setDialogOpen(true);
	};

	const handleClose = () => {
		disclaimerShown.setValue(true);
		setDialogOpen(false);
	};


	useEffect(() => {
		(async () => {
			const disclaimerShownValue = await disclaimerShown.getValue();
			if (!disclaimerShownValue) {
				handleOpen();
			}
		})();
	}, []);

	return (
		<>
			<Box mx={18} my={2} px={6} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', border: '2px solid #ccc', borderRadius: '15px', '& > *': { padding: '10px' } }}>
			</Box>
		</>
	);
}

export default App;
