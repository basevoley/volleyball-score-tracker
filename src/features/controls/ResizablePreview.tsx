// ResizablePreview.js
import React, { useState, useEffect } from 'react';
import { Box } from '@mui/material';
import { ResizableBox } from 'react-resizable';
import 'react-resizable/css/styles.css';

const NATIVE_WIDTH = 2560;//1280;
const NATIVE_HEIGHT = 1440;//720;

interface Props {
  src: string;
}

const ResizablePreview = ({ src }: Props) => {
  const [size, setSize] = useState({ width: 400, height: 225 });
  const [iframeKey, setIframeKey] = useState(0);
  const scale = size.width / NATIVE_WIDTH;

  // Debug: Log the src prop
  useEffect(() => {
    console.log('ResizablePreview received src:', src);
  }, [src]);

  // Force iframe reload when src changes
  useEffect(() => {
    setIframeKey(prev => prev + 1);
  }, [src]);

  const onResize = (_event: React.SyntheticEvent, { size }: { size: { width: number; height: number } }) => {
    setSize(size);
  };

  return (
    <Box sx={{pb: 1}}
      // sx={{ paddingTop: '10px', paddingBottom: '10px' }}
      >
      <ResizableBox
        width={size.width}
        height={size.height}
        minConstraints={[128, 72]}
        maxConstraints={[1280, 720]}
        lockAspectRatio={true}
        resizeHandles={['s']}
        onResizeStop={onResize}
        style={{ left: '50%', transform: 'translate(-50%,0)'}}
      >
        <Box
          sx={{
            width: '100%',
            height: '100%',
            overflow: 'hidden',
            position: 'relative',
            border: '1px solid gray',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            borderRadius: '5px',
            backgroundColor: 'white',
          }}
        >
          <iframe
            key={iframeKey}
            src={src}
            title="External website preview (Scaled)"
            width={NATIVE_WIDTH}
            height={NATIVE_HEIGHT}
            style={{
              position: 'absolute',
              top: '0',
              left: '0',
              border: 'none',
              transform: `scale(${scale})`,
              transformOrigin: '0 0',
            }}
            // Add these attributes to help with loading
            allow="autoplay; fullscreen"
            sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals"
          />
        </Box>
      </ResizableBox>
    </Box>
  );
};

export default ResizablePreview;
