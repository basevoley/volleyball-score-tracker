import React, { useState } from 'react';
import { Box, Button, Typography, Collapse, IconButton,
    //  Menu, MenuItem, 
     Tooltip, Snackbar, Alert } from '@mui/material';
import CastIcon from '@mui/icons-material/Cast';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ResizablePreview from './ResizablePreview';
import { useSocket } from '../contexts/SocketContext';
import { SyncProblem } from '@mui/icons-material';

interface Props {
    overlayUrl: string;
}

const OverlayPreview = ({ overlayUrl }: Props) => {
    const { socket } = useSocket();
    const [isExpanded, setIsExpanded] = useState(true);
    const [openSnackbar, setOpenSnackbar] = useState(false);
    // const [anchorEl, setAnchorEl] = React.useState(null);
    // const open = Boolean(anchorEl);
    // const handleClick = (event) => {
    //     setAnchorEl(event.currentTarget);
    // };
    // const handleClose = () => {
    //     setAnchorEl(null);
    // };

    const handleCopyUrl = () => {
        navigator.clipboard.writeText(overlayUrl);
        // alert("Output URL copied to clipboard");
        setOpenSnackbar(true);
    };
    
    const handleCloseSnackbar = (_event: React.SyntheticEvent | Event, reason?: string) => {
        if (reason === 'clickaway') return;
        setOpenSnackbar(false);
    };

    const handleReloadOverlay = () => {
        if (socket) {
            socket.emit('reload');
        }
    };

    const toggleExpand = () => {
        setIsExpanded(!isExpanded);
    };

    return (
        <>
            {/* Header with title and buttons */}
            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    p: 1
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="h6" sx={{ m: 0 }}>
                        Vista Previa
                    </Typography>
                    <IconButton
                        onClick={toggleExpand}
                        size="small"
                        sx={{
                            color: '#666',
                            '&:hover': {
                                backgroundColor: 'rgba(0, 0, 0, 0.04)'
                            }
                        }}
                    >
                        {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    </IconButton>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Tooltip title="Copiar Overlay URL">
                        <span>
                            <Button
                                variant="contained"
                                size="small"
                                onClick={handleCopyUrl}
                                startIcon={<CastIcon />}
                                sx={{
                                    display: { xs: 'none', md: 'flex' },
                                    backgroundColor: '#4CAF50',
                                    color: 'white',
                                    fontSize: '0.75rem',
                                    padding: '6px 12px',
                                    '&:hover': {
                                        backgroundColor: '#45a049'
                                    }
                                }}
                            >
                                Copiar URL
                            </Button>
                            <IconButton
                                onClick={handleCopyUrl}
                                size="small"
                                sx={{
                                    display: { xs: 'flex', md: 'none' },
                                    backgroundColor: '#4CAF50',
                                    color: 'white',
                                    fontSize: '0.75rem',
                                    '&:hover': {
                                        backgroundColor: '#45a049'
                                    },
                                    '&:disabled': {
                                        backgroundColor: '#e0e0e0'
                                    }
                                }}
                            >
                                <CastIcon />
                            </IconButton>
                        </span>
                    </Tooltip>
                    <Tooltip title="Resincronizar Overlay">
                        <span>

                            <Button
                                variant="contained"
                                size="small"
                                onClick={handleReloadOverlay}
                                startIcon={<SyncProblem />}
                                disabled={!isExpanded}
                                sx={{
                                    display: { xs: 'none', md: 'flex' },
                                    backgroundColor: '#FF9800',
                                    color: 'white',
                                    fontSize: '0.75rem',
                                    padding: '6px 12px',
                                    '&:hover': {
                                        backgroundColor: '#F57C00'
                                    },
                                    '&:disabled': {
                                        backgroundColor: '#ccc'
                                    }
                                }}
                            >
                                Resincronizar
                            </Button>
                            <IconButton
                                onClick={handleReloadOverlay}
                                size="small"
                                sx={{
                                    display: { xs: 'flex', md: 'none' },
                                    backgroundColor: '#FF9800',
                                    color: 'white',
                                    fontSize: '0.75rem',
                                    '&:hover': {
                                        backgroundColor: '#F57C00'
                                    },
                                    '&:disabled': {
                                        backgroundColor: '#e0e0e0'
                                    }
                                }}
                            >
                                <SyncProblem />
                            </IconButton>
                        </span>
                    </Tooltip>
                    {/* <IconButton
                        onClick={handleClick}
                        size="small"
                        sx={{
                            color: '#666',
                            '&:hover': {
                                backgroundColor: 'rgba(0, 0, 0, 0.04)'
                            }
                        }}
                    >
                        <MoreVertIcon />
                    </IconButton>
                          <Menu
        id="basic-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        slotProps={{
          list: {
            'aria-labelledby': 'basic-button',
          },
        }}
      >
        <MenuItem  onClick={handleClose}>Profile</MenuItem>
        <MenuItem onClick={handleClose}>My account</MenuItem>
        <MenuItem onClick={handleClose}>Logout</MenuItem>
      </Menu> */}

                </Box>
            </Box>

            {/* Collapsible Preview */}
            <Collapse in={isExpanded} timeout="auto" unmountOnExit sx={{ minHeight: '10px' }}>
                <ResizablePreview src={overlayUrl} />
            </Collapse>
            <Snackbar 
                open={openSnackbar} 
                autoHideDuration={3000} 
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
                <Alert 
                    onClose={handleCloseSnackbar} 
                    severity="success" 
                    sx={{ minWidth: '250px', borderRadius: '8px' }}
                >
                    URL copiada al portapapeles
                </Alert>
            </Snackbar>
        </>
    );
};

export default OverlayPreview;
