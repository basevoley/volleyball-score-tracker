import { useState } from 'react';
import type { ReactNode } from 'react';
import { Box, Button, IconButton, TextField, Tooltip, Typography } from '@mui/material';
import { Undo } from '@mui/icons-material';
import ConfirmationDialog from '../../shared/components/ConfirmationDialog';
import type { HistoryEntry, TeamRecord } from '../../types';
import type { useMatchManager } from '../../hooks/useMatchManager';

type MatchManager = ReturnType<typeof useMatchManager>;

/** An in-progress rally action that undo should revert before touching the match history. */
export interface RallyActionUndo {
  label: string;
  undo: () => void;
}

interface Props {
  teams: TeamRecord<string>;
  matchManager: MatchManager;
  rallyAction?: RallyActionUndo | null;
  /** Extra buttons rendered next to the undo button. */
  children?: ReactNode;
}

const describeHistoryEntry = (entry: HistoryEntry, teams: TeamRecord<string>): string => {
  switch (entry.entryType) {
    case 'rally':           return `Punto ${teams[entry.server]}`;
    case 'point':           return entry.faultingTeam
                              ? `Falta ${teams[entry.faultingTeam]}`
                              : `Punto ${teams[entry.team]}`;
    case 'timeout':         return `Tiempo muerto ${teams[entry.team]}`;
    case 'substitution':    return `Sustitución ${teams[entry.team]}`;
    case 'adjust':          return `Ajuste marcador ${teams[entry.team]}`;
    case 'set-end':         return `Fin del set ${entry.setNumber}`;
    case 'sets-won-adjust': return `Ajuste sets ${teams[entry.team]}`;
  }
};

/** "Previous action" read-out plus undo button. Reverts a pending rally action first, then history entries. */
function HistoryUndoBar({ teams, matchManager, rallyAction = null, children }: Props) {
  const { match, undoLastHistoryEntry, canUndoHistory, isSetBoundaryUndo } = matchManager;
  const [showUndoSetConfirm, setShowUndoSetConfirm] = useState(false);

  const canUndo = !!rallyAction || canUndoHistory;

  const previousActionText = rallyAction
    ? rallyAction.label
    : canUndoHistory
      ? describeHistoryEntry(match.history[match.history.length - 1], teams)
      : 'Ninguna';

  const handleUndo = () => {
    if (rallyAction) {
      rallyAction.undo();
    } else if (isSetBoundaryUndo) {
      setShowUndoSetConfirm(true);
    } else {
      undoLastHistoryEntry();
    }
  };

  const confirmUndoSet = () => {
    undoLastHistoryEntry();
    setShowUndoSetConfirm(false);
  };

  return (
    <>
      <ConfirmationDialog
        open={showUndoSetConfirm}
        message={<Typography align='center'>Esta acción revertirá el fin de set y el punto que lo originó, restaurando el marcador anterior.<br/>¿Seguro que desea deshacer el fin de set?</Typography>}
        onConfirm={confirmUndoSet}
        onCancel={() => setShowUndoSetConfirm(false)}
      />

      <Box sx={{ display: 'flex', gap: 1, mt: 1, alignItems: 'center' }}>
        <TextField
          fullWidth
          size='small'
          label="Acción anterior"
          placeholder="Ninguna"
          value={previousActionText}
          slotProps={{
            input: {
              readOnly: true,
            },
          }}
          sx={{ flex: 1 }}
        />
        <Box sx={{ display: 'flex', flexDirection: 'row', flexWrap: 'nowrap', gap: 1 }}>
          <Tooltip title={'Deshacer última acción'}>
            <span>
              <IconButton
                onClick={handleUndo}
                disabled={!canUndo}
                sx={{
                  display: { xs: 'flex', md: 'none' },
                  backgroundColor: '#4CAF50',
                  color: 'white',
                  '&:hover': { backgroundColor: '#45a049' },
                  '&:disabled': { backgroundColor: '#e0e0e0' }
                }}
              >
                <Undo />
              </IconButton>
              <Button
                variant="contained"
                onClick={handleUndo}
                disabled={!canUndo}
                startIcon={<Undo />}
                sx={{
                  display: { xs: 'none', md: 'flex' },
                  backgroundColor: '#4CAF50',
                  color: 'white',
                  fontSize: '0.75rem',
                  '&:hover': { backgroundColor: '#45a049' },
                  '&:disabled': { backgroundColor: '#e0e0e0' }
                }}
              >
                Deshacer Acción
              </Button>
            </span>
          </Tooltip>
          {children}
        </Box>
      </Box>
    </>
  );
}

export default HistoryUndoBar;
