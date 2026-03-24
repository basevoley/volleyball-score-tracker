import React, { useEffect, useState } from 'react';
import {
    Box,
    TextField,
    Autocomplete,
    Avatar,
    Typography,
} from '@mui/material';
import staticImages from './badges';

interface Props {
  label: string;
  placeholderText?: string;
  inputValue: string;
  onInputChange: (value: string) => void;
}

const CustomCombobox = ({ label, placeholderText, inputValue, onInputChange }: Props) => {
    // Buscamos el objeto que coincida con la URL actual para que el Autocomplete lo resalte
    const selectedOption = staticImages.find(img => img.url === inputValue) || null;
    const [hasImageError, setHasImageError] = useState(false);
    const [localText, setLocalText] = useState(inputValue || "");

    useEffect(() => {
                setLocalText(inputValue || "");

        setHasImageError(false);
    }, [inputValue]);

    const commitChange = (value: string) => {
        if (value !== inputValue) {
            onInputChange(value);
        }
    };

    const renderOptions = (props: React.HTMLAttributes<HTMLLIElement> & { key?: React.Key }, option: { name: string; url: string }) => {
        const { key, ...optionProps } = props;
        return (
            <Box
                component="li"
                key={key}
                {...optionProps}
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 2,
                    px: 2,
                    py: 1,
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                }}
            >
                <Typography variant="body2" noWrap sx={{ flexGrow: 1 }}>
                    {option.name}
                </Typography>
                <Avatar
                    src={option.url}
                    variant="square"
                    sx={{ width: '3rem', height: '3rem', flexShrink: 0, borderRadius: 0.5, border: '1px solid', borderColor: 'divider' }}
                />
            </Box>
        );
    };

    return (
        <Box sx={{ display: 'flex', width: '100%', gap: 2, alignItems: 'center' }}>
            <Autocomplete
                size="small"
                freeSolo
                options={staticImages}

                // value={selectedOption || inputValue || null}
                value={selectedOption || localText || null}
                // inputValue={localText}

                getOptionLabel={(option) => (typeof option === 'string' ? option : option.url)}

                isOptionEqualToValue={(option, value) => {
                    const compare = typeof value === 'string' ? value : value?.url;
                    return option.url === compare;
                }}

                // onChange={(event, newValue) => {
                //     // Si seleccionas de la lista, extraemos la URL; si es texto manual, el string
                //     const valueToEmit = typeof newValue === 'object' ? newValue?.url : newValue;
                //     onInputChange(valueToEmit || "");
                // }}
                onChange={(event, newValue) => {
                    const val = typeof newValue === 'object' ? newValue?.url : newValue;
                    const finalValue = val || "";
                    setLocalText(finalValue);
                    commitChange(finalValue); // Selección instantánea
                }}


                onInputChange={(event, newInputValue) => {
                    // Solo actualizamos si el cambio viene de teclear (evita loops en selecciones)
                    if (event?.type === 'change') {
                        // onInputChange(newInputValue);
                        setLocalText(newInputValue);
                    }
                }}
                // onInputChange={(event, newInputValue) => {
                //     setLocalText(newInputValue);
                // }}

                filterOptions={(options, { inputValue }) => {
                    const cleanQuery = inputValue.toLowerCase();
                    return options.filter(opt =>
                        opt.name.toLowerCase().includes(cleanQuery) ||
                        opt.url.toLowerCase().includes(cleanQuery)
                    );
                }}

                renderOption={renderOptions}
                renderInput={(params) => (
                    <TextField
                        {...params}
                        label={label}
                        placeholder={placeholderText}
                        onBlur={() => commitChange(localText)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                commitChange(localText);
                            }
                        }}
                    // En v7 puedes usar slotProps.input para estilos específicos si lo deseas
                    />
                )}
                sx={{ flexGrow: 1 }}
            />

            {/* Cuadro de Previsualización */}
            <Box
                sx={{
                    width: 80,
                    height: 80,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '2px solid',
                    borderColor: hasImageError ? 'error.main' : 'divider',
                    borderRadius: 1,
                    bgcolor: hasImageError ? 'error.light' : 'background.paper',
                    overflow: 'hidden',
                    flexShrink: 0
                }}
            >
                {inputValue && !hasImageError ? (
                    <Box
                        component="img"
                        src={inputValue}
                        alt="Badge Preview"
                        sx={{ width: '100%', height: '100%', objectFit: 'contain' }}
                        onError={() => setHasImageError(true)}
                    />
                ) : (
                    <Typography variant="caption" align="center" sx={{ color: hasImageError ? 'white' : 'text.disabled', p: 0.5 }}>
                        {hasImageError ? 'URL Inválida' : 'Sin Imagen'}
                    </Typography>
                )}
            </Box>
        </Box>
    );
};

export default CustomCombobox;
