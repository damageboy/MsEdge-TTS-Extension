import { createContext, useContext, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { Button, CssBaseline, TextField } from '@mui/material';
import Grid from '@mui/material/Unstable_Grid2/Grid2';
import SnackbarAlert from '@/assets/components/SnackbarAlert';
import SelectAutocomplete from '@/assets/components/SelectAutocomplete';
import useFetch from '@/assets/custom hooks/useFetch';
import useTTS from '@/assets/custom hooks/useTTS';
import { storage } from 'wxt/storage';
import ButtonAppBar from '@/assets/components/ButtonAppBar';
import TemporaryDrawer from '@/assets/components/TemporaryDrawer';
import { useTheme, ThemeProvider, createTheme } from '@mui/material/styles';

const ColorModeContext = createContext({ toggleColorMode: () => { } });

const currentVoiceItem = storage.defineItem<Record<string, any>>('local:currentVoice');
const currentSettingsItem = storage.defineItem<Record<string, any>>('local:currentSettings');
const textItem = storage.defineItem<string>('session:text');
const colorModeItem = storage.defineItem<'light' | 'dark'>('local:colorMode', { defaultValue: 'light' });

const voiceReducer = (state: any, action: any) => {
    let currentVoice;
    switch (action.type) {
        case 'select_language':
            currentVoice = { language: action.value, country: '', voice: '' };
            break;
        case 'select_country':
            currentVoice = { ...state, country: action.value, voice: '' };
            break;
        case 'select_voice':
            currentVoice = { ...state, voice: action.value };
            break;
        case 'set_voice':
            currentVoice = { ...action.value };
            break;
        default:
            return state;
    }

    currentVoiceItem.setValue(currentVoice);
    return { ...currentVoice };
};

const textReducer = (state: any, action: any) => {
    switch (action.type) {
        case 'set_text':
            return action.value;
        default:
            return state;
    }
};

const alertReducer = (state: any, action: any) => {
    switch (action.type) {
        case 'close_alert':
            return { ...state, open: false };
        case 'voices_error':
            return { open: true, alert: { severity: 'error', msg: 'Error occurred while loading voices' } };
        case 'audio_error':
            return { open: true, alert: { severity: 'error', msg: 'Error occurred while generating audio' } };
        case 'generate_audio':
            return { open: true, alert: { severity: 'info', msg: 'Generating audio...', icon: 'circular-progress' } };
        case 'no_voice_selected':
            return { open: true, alert: { severity: 'warning', msg: 'Please select a voice' } };
        default:
            return state;
    }
};

const settingsReducer = (state: any, action: any) => {
    let currentSettings;
    switch (action.type) {
        case 'set_rate':
            currentSettings = { ...state, rate: action.value };
            break;
        case 'set_pitch':
            currentSettings = { ...state, pitch: action.value };
            break;
        case 'set_settings':
            currentSettings = { ...action.value };
            break;
        default:
            return state;
    }

    currentSettingsItem.setValue(currentSettings);
    return { ...currentSettings };
};

function App() {
    const theme = useTheme();
    const colorMode = useContext(ColorModeContext);

    const [voiceState, voiceDispatch] = useReducer(voiceReducer, {
        language: '',
        country: '',
        voice: null,
    });

    const [text, textDispatch] = useReducer(textReducer, '');

    const [alertState, alertDispatch] = useReducer(alertReducer, {
        open: false,
        alert: {}
    });

    const [settings, settingsDispatch] = useReducer(settingsReducer, {
        rate: 0,
        pitch: 0,
    });

    // Load data from server
    const [voicesLoading, voicesError, languages, countries, voices] = useFetch(voiceState);

    const { audioUrl, audioLoading, audioError, generateAudio } = useTTS();

    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

    const toggleDrawer = (open: boolean) => {
        setIsDrawerOpen(open);
    };

    const handleChange = (value: string, type: string) => {
        if (!value) return;

        voiceDispatch({ type, value });
        alertDispatch({ type: 'close_alert' });
    };

    const handleTextChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        textDispatch({ type: 'set_text', value: e.target.value });
    };

    const handleSliderChange = (value: number, type: string) => {
        settingsDispatch({ type, value });
    };

    const handleClose = (event?: React.SyntheticEvent | Event, reason?: string) => {
        if (reason === 'clickaway') {
            return;
        }
        alertDispatch({ type: 'close_alert' });
    };

    const handleSubmit = () => {
        alertDispatch({ type: 'generate_audio' });
        generateAudio(text, voiceState.voice.shortName, settings);
    };

    // The listener function captures the state at the time it was defined, and it doesn't get updated state values when they change.
    // To get the updated values, we use refs to store the state values and update them in the useEffect hook.
    const voiceStateRef = useRef(voiceState);
    const settingsRef = useRef(settings);

    useEffect(() => {
        voiceStateRef.current = voiceState;
        settingsRef.current = settings;
    }, [voiceState, settings]);

    useEffect(() => {
        // If side panel is open, clicking on context menu item will change text in storage => listen for changes => generate audio
        const unwatch = textItem.watch((newValue) => {
            if (!newValue) return;
            textDispatch({ type: 'set_text', value: newValue });
            textItem.removeValue();
            if (voiceStateRef.current && voiceStateRef.current.voice) {
                alertDispatch({ type: 'generate_audio' });
                generateAudio(newValue!, voiceStateRef.current.voice.shortName, settingsRef.current);
            }
            else {
                alertDispatch({ type: 'no_voice_selected' });
            }
        });

        (async () => {
            const currentVoice = await currentVoiceItem.getValue();
            const currentSettings = await currentSettingsItem.getValue();
            if (currentVoice) voiceDispatch({ type: 'set_voice', value: currentVoice });
            if (currentSettings) settingsDispatch({ type: 'set_settings', value: currentSettings });
            const storageText = await textItem.getValue();
            if (storageText) {
                textDispatch({ type: 'set_text', value: storageText });
                textItem.removeValue();
                if (currentVoice && currentVoice.voice) {
                    alertDispatch({ type: 'generate_audio' });
                    generateAudio(storageText, currentVoice.voice.shortName, currentSettings || settings);
                }
                else {
                    alertDispatch({ type: 'no_voice_selected' });
                }
            }
        })();
    }, []);

    useEffect(() => {
        if (audioUrl) {
            alertDispatch({ type: 'close_alert' });
        }
    }, [audioUrl]);

    useEffect(() => {
        if (voicesError) alertDispatch({ type: 'voices_error' });
        else if (audioError) alertDispatch({ type: 'audio_error' });
    }, [voicesError, audioError]);

    return (
        <>
            <CssBaseline />
            <TemporaryDrawer open={isDrawerOpen} toggleDrawer={toggleDrawer} settings={settings} handleSliderChange={handleSliderChange} />
            <ButtonAppBar menuClick={() => toggleDrawer(true)} toggleColorMode={colorMode.toggleColorMode} colorMode={theme.palette.mode} />
            <Grid container margin={1} rowSpacing={2} columns={1}>
                <Grid xs={1}>
                    <SelectAutocomplete options={languages} label="Language" loading={voicesLoading} value={voiceState.language} onChange={(e: any, value: string) => handleChange(value, 'select_language')} />
                </Grid>
                <Grid xs={1}>
                    <SelectAutocomplete options={countries} label="Country" value={voiceState.country} onChange={(e: any, value: string) => handleChange(value, 'select_country')} isDisabled={!voiceState.language.length} />
                </Grid>
                <Grid xs={1}>
                    <SelectAutocomplete options={Object.keys(voices)} label="Voice" value={voiceState.voice && voiceState.voice.name} onChange={(e: any, value: string) => handleChange(voices[value], 'select_voice')} isDisabled={!voiceState.country.length} />
                </Grid>
                <Grid xs={1}>
                    <TextField
                        value={text}
                        onChange={handleTextChange}
                        fullWidth
                        label='Text'
                        placeholder='Enter text to be spoken'
                        multiline
                        minRows={3}
                        maxRows={20}
                    />
                </Grid>
                <Grid xs={1}>
                    <Button
                        variant='contained'
                        sx={{ padding: '.75rem' }}
                        disabled={audioLoading || !voiceState.voice || !text.trim().length}
                        fullWidth
                        onClick={handleSubmit}
                    >
                        Generate Audio
                    </Button>
                </Grid>
                <Grid xs={1}>
                    <audio src={audioUrl} autoPlay controls style={{ width: '100%' }}></audio>
                </Grid>
            </Grid>
            <SnackbarAlert open={alertState.open} alert={alertState.alert} onClose={handleClose} />
        </>
    );
}

export default function ToggleColorMode() {
    const [mode, setMode] = useState<'light' | 'dark'>('light');
    const colorMode = useMemo(
        () => ({
            toggleColorMode: () => {
                setMode((prevMode) => {
                    const currentMode = prevMode === 'light' ? 'dark' : 'light';
                    colorModeItem.setValue(currentMode);
                    return currentMode;
                });
            },
        }),
        [],
    );

    const components = {
        dark: {
            MuiButton: {
                styleOverrides: {
                    contained: {
                        color: 'white',
                        backgroundColor: '#304ffe',
                        '&:hover': {
                            backgroundColor: '#1e40ff',

                        }
                    }
                },
            },
            MuiAlert: {
                styleOverrides: {
                    filledSuccess: {
                        backgroundColor: 'green',
                        color: 'white'
                    },
                    filledError: {
                        backgroundColor: 'red',
                        color: 'white'
                    },
                    filledWarning: {
                        // backgroundColor: 'orange',
                        color: 'white'
                    },
                    filledInfo: {
                        backgroundColor: '#304ffe',
                        color: 'white'
                    },
                }
            }
        },
        light: {
            MuiAlert: {
                styleOverrides: {
                    filledInfo: {
                        backgroundColor: '#00e5ff',
                        color: 'black'
                    }
                }
            }
        }
    }

    const theme = useMemo(
        () =>
            createTheme({
                palette: {
                    mode,
                },
                components: components[mode]
            }),
        [mode],
    );

    useEffect(() => {
        (async () => {
            const colorModeValue = await colorModeItem.getValue();
            setMode(colorModeValue);
        })();
    }, []);

    return (
        <ColorModeContext.Provider value={colorMode}>
            <ThemeProvider theme={theme}>
                <App />
            </ThemeProvider>
        </ColorModeContext.Provider>
    );
};
