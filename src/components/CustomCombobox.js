import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
    Box,
    TextField,
    Paper,
    List,
    ListItem,
    ListItemButton,
    ListItemText,
    Avatar,
    Popper,
    ClickAwayListener
} from '@mui/material';
import staticImages from './badges';

const CustomCombobox = ({ label, placeholderText, inputValue, onInputChange }) => {
    const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false);
    const inputRef = useRef(null);

    const suggestions = useMemo(() => {
        if (inputValue.length > 0) {
            let options = staticImages.filter(image =>
                image.name.toLowerCase().includes(inputValue.toLowerCase()) || 
                image.path.toLowerCase().includes(inputValue.toLowerCase())
            );
            if (options.length > 0) {
                return options;
            }
            return staticImages;
        }
        return staticImages;
    }, [inputValue]);

    const handleSelect = (path) => {
        onInputChange(path);
        setIsSuggestionsOpen(false);
    };

    const handleChange = (e) => {
        onInputChange(e.target.value);
        setIsSuggestionsOpen(true);
    };

    const handleClickAway = () => {
        setIsSuggestionsOpen(false);
    };

    return (
        <Box
            sx={{
                display: 'flex',
                width: '100%',
                gap: '5px',
                alignItems: 'center'
            }}
        >
            <ClickAwayListener onClickAway={handleClickAway}>
                <Box
                    sx={{
                        position: 'relative',
                        flexGrow: 1,
                        boxSizing: 'border-box'
                    }}
                >
                    <TextField
                        ref={inputRef}
                        fullWidth
                        size="small"
                        value={inputValue}
                        onChange={handleChange}
                        onFocus={() => suggestions.length > 0 && setIsSuggestionsOpen(true)}
                        label={label}
                        placeholder={placeholderText}
                        sx={{
                            '& .MuiInputBase-input': {
                                padding: '8px'
                            }
                        }}
                    />

                    <Popper
                        open={isSuggestionsOpen && suggestions.length > 0}
                        anchorEl={inputRef.current}
                        placement="bottom-start"
                        style={{ width: inputRef.current?.offsetWidth, zIndex: 1300 }}
                    >
                        <Paper
                            elevation={3}
                            sx={{
                                maxHeight: 200,
                                overflowY: 'auto',
                                mt: 0.5
                            }}
                        >
                            <List disablePadding>
                                {suggestions.map((image) => (
                                    <ListItem
                                        key={image.id}
                                        disablePadding
                                        sx={{
                                            borderBottom: '1px solid #eee',
                                            '&:last-child': {
                                                borderBottom: 'none'
                                            }
                                        }}
                                    >
                                        <ListItemButton
                                            onClick={() => handleSelect(image.path)}
                                            sx={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                gap: 1,
                                                py: 1,
                                                '&:hover': {
                                                    backgroundColor: '#f0f0f0'
                                                }
                                            }}
                                        >
                                            <ListItemText
                                                primary={image.name}
                                                primaryTypographyProps={{
                                                    fontSize: '0.875rem'
                                                }}
                                            />
                                            <Avatar
                                                src={image.path}
                                                alt={image.name}
                                                variant="square"
                                                sx={{
                                                    width: 40,
                                                    height: 40
                                                }}
                                            />
                                        </ListItemButton>
                                    </ListItem>
                                ))}
                            </List>
                        </Paper>
                    </Popper>
                </Box>
            </ClickAwayListener>

            {inputValue ? (
                <Box
                    component="img"
                    src={inputValue}
                    alt="Preview"
                    sx={{
                        width: 100,
                        height: 100,
                        objectFit: 'contain'
                    }}
                />
            ) : (
                <Box
                    sx={{
                        width: 100,
                        height: 100,
                        border: '1px solid #ccc',
                        backgroundColor: '#f9f9f9',
                        position: 'relative',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        '&::before': {
                            content: '"No Image"',
                            fontSize: '10px',
                            color: '#888',
                            textAlign: 'center',
                            lineHeight: 1.2,
                            zIndex: 1
                        },
                        '&::after': {
                            content: '""',
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            background: `
                                linear-gradient(to top right, 
                                    transparent calc(50% - 1px), 
                                    #ccc calc(50% - 1px), 
                                    #ccc calc(50% + 1px), 
                                    transparent calc(50% + 1px)),
                                linear-gradient(to bottom right, 
                                    transparent calc(50% - 1px), 
                                    #ccc calc(50% - 1px), 
                                    #ccc calc(50% + 1px), 
                                    transparent calc(50% + 1px))
                            `
                        }
                    }}
                />
            )}
        </Box>
    );
};

export default CustomCombobox;
