import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import Divider from '@mui/material/Divider';
import { FormControlLabel, IconButton, Link, Stack, Switch, Typography } from '@mui/material';
import { ArrowBackIosNew, GitHub } from '@mui/icons-material';
import CustomSlider from './CustomSlider';
import { useEffect, useState } from 'react';
export default function TemporaryDrawer(props: any) {
    const { open, toggleDrawer, settings, handleSliderChange } = props;

    const DrawerContent = (
        <Box>
            <IconButton
                size="large"
                edge="start"
                color="inherit"
                sx={{ m: 1 }}
                onClick={() => toggleDrawer(false)}
            >
                <ArrowBackIosNew />
            </IconButton>
            <Typography mx={2} >Additional Settings:</Typography>
            <br />
            <Stack spacing={2} sx={{ mx: 2 }}>
                <CustomSlider value={settings.rate} labels={['Slow', 'Default', 'Fast']} min={-50} max={50} defaultValue={0} label='Rate' onChange={(e: any, value: number) => handleSliderChange(value, 'set_rate')} />
                <CustomSlider value={settings.pitch} labels={['Low', 'Default', 'High']} min={-50} max={50} defaultValue={0} label='Pitch' onChange={(e: any, value: number) => handleSliderChange(value, 'set_pitch')} />
            </Stack>
            <Divider sx={{ m: 2 }} />
            <Typography mx={2} >
                ⭐ Rate us on <Link
                    href={import.meta.env.CHROME ? 'https://chrome.google.com/webstore/detail/oajalfneblkfiejoadecnmodfpnaeblh' : 'https://addons.mozilla.org/en-US/firefox/addon/ms-edge-tts-text-to-speech/'}
                    target="_blank"
                >
                    {import.meta.env.CHROME ? 'Chrome Web Store' : 'Mozilla Addons'}
                </Link>
                <br /><br />
                ✨ Feature request / 🐞 Bug report :👉
                <IconButton
                    // sx={{ mx: 0 }}
                    size='small'
                    href='https://github.com/yacine-bens/MsEdge-TTS-Extension/issues/new/choose'
                    target='_blank'
                >
                    <GitHub />
                </IconButton>
            </Typography>
        </Box>
    );

    useEffect(() => {
        if (!import.meta.env.CHROME) return;
        (async () => {
            const permissions = await browser.permissions.getAll();
            if (!permissions.origins?.includes("https://*/*")) {
                return;
            }
        })();
    }, []);

    return (
        <div>
            <Drawer
                open={open}
                onClose={() => toggleDrawer(false)}
                PaperProps={{
                    sx: { width: '100%' }
                }}
            >
                {DrawerContent}
            </Drawer>
        </div>
    );
}
