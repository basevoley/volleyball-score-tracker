import React, { useState, useEffect } from 'react';
import { HexColorPicker } from "react-colorful";
import { useFloating, offset, flip, shift, autoUpdate, useInteractions, useDismiss } from '@floating-ui/react';
import UniformIcon from './UniformIcon';

export function TeamColorSelector({ color, onColorChange, iconSize = 50 }) {
  const [isOpen, setIsOpen] = useState(false);
  
  // 1. Estado local temporal para previsualización inmediata en el icono
  const [tempColor, setTempColor] = useState(color);

  // Sincronizar el estado local si el color del padre cambia externamente
  useEffect(() => {
    setTempColor(color);
  }, [color]);

  const { refs, floatingStyles, context } = useFloating({
    open: isOpen,
    onOpenChange: (open) => {
      setIsOpen(open);
      // 2. SOLO cuando se cierra (open === false), notificamos al padre
      if (!open) {
        onColorChange(tempColor);
      }
    },
    middleware: [offset(10), flip(), shift({ padding: 10 })],
    whileElementsMounted: autoUpdate,
  });

  // 3. Hook para cerrar al hacer clic fuera
  const dismiss = useDismiss(context);
  const { getReferenceProps, getFloatingProps } = useInteractions([dismiss]);

  return (
    <>
      <div 
        ref={refs.setReference} 
        {...getReferenceProps()}
        onClick={() => setIsOpen(!isOpen)} 
        style={{ cursor: 'pointer', display: 'inline-block' }}
      >
        {/* Mostramos el tempColor para que el usuario vea el cambio en vivo */}
        <UniformIcon shirtColor={tempColor} size={iconSize}/>
      </div>

      {isOpen && (
        <div
          ref={refs.setFloating}
          style={{
            ...floatingStyles,
            zIndex: 100,
            background: "#fff",
            padding: "10px",
            borderRadius: "8px",
            boxShadow: "0 6px 20px rgba(0,0,0,0.2)",
          }}
          {...getFloatingProps()}
        >
          <HexColorPicker 
            color={tempColor} 
            onChange={setTempColor} // Actualiza solo el estado local
          />
        </div>
      )}
    </>
  );
}
