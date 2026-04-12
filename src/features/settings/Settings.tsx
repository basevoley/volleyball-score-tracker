import React from 'react';
import { Box, Paper, Typography, Accordion, AccordionSummary, AccordionDetails } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { usePreferences } from '../../contexts/PreferencesContext';
import { SettingRow } from './SettingRow';
import { SocialNetworksSection } from './SocialNetworksSection';
import { SponsorsSection } from './SponsorsSection';
import { AppearanceSection } from './AppearanceSection';
import { SubscribeSection } from './SubscribeSection';
import { OVERLAY_CUSTOMIZATIONS_ENABLED } from '../../config'

const Settings = () => {
    const { noStats, setNoStats } = usePreferences();

    return (
        <Box sx={{ width: '100%', p: { xs: 1, sm: 2 }, boxSizing: 'border-box' }}>
            <Paper
                elevation={3}
                sx={{
                    width: '100%',
                    maxWidth: '800px',
                    margin: '0 auto',
                    p: { xs: 2, sm: 4 },
                    boxSizing: 'border-box',
                    borderRadius: 2,
                }}
            >
                <Accordion sx={{ mb: 1, boxShadow: 'none', border: '1px solid #e0e0e0' }}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography variant="h6">Seguimiento del Partido</Typography>
                    </AccordionSummary>
                    <AccordionDetails sx={{ pt: 0 }}>
                        <SettingRow
                            title="Modo sin estadísticas"
                            description="Oculta los controles de rally durante el partido y deshabilita la tabla de estadísticas en el panel de resultados del overlay."
                            checked={noStats}
                            onChange={setNoStats}
                        />
                    </AccordionDetails>
                </Accordion>

                {OVERLAY_CUSTOMIZATIONS_ENABLED && (
                    <>
                        <Accordion sx={{ mt: 1, boxShadow: 'none', border: '1px solid #e0e0e0' }}>
                            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                <Typography variant="h6">Redes Sociales</Typography>
                            </AccordionSummary>
                            <AccordionDetails>
                                <SocialNetworksSection />
                            </AccordionDetails>
                        </Accordion><Accordion sx={{ mt: 1, boxShadow: 'none', border: '1px solid #e0e0e0' }}>
                            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                <Typography variant="h6">Patrocinadores</Typography>
                            </AccordionSummary>
                            <AccordionDetails>
                                <SponsorsSection />
                            </AccordionDetails>
                        </Accordion><Accordion sx={{ mt: 1, boxShadow: 'none', border: '1px solid #e0e0e0' }}>
                            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                <Typography variant="h6">Suscripción</Typography>
                            </AccordionSummary>
                            <AccordionDetails>
                                <SubscribeSection />
                            </AccordionDetails>
                        </Accordion><Accordion sx={{ mt: 1, boxShadow: 'none', border: '1px solid #e0e0e0' }}>
                            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                <Typography variant="h6">Apariencia General</Typography>
                            </AccordionSummary>
                            <AccordionDetails>
                                <AppearanceSection />
                            </AccordionDetails>
                        </Accordion>
                    </>
                )}
            </Paper>
        </Box>
    );
};

export default Settings;
