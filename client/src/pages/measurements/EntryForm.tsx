import { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Stack,
  Typography,
  Paper,
  Grid,
} from '@mui/material';
import type { MeasurementEntry, MeasurementType } from '../../hooks/useMeasurements';

interface EntryFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: EntryFormData) => Promise<void>;
  entry?: MeasurementEntry | null;
  loading?: boolean;
}

export interface EntryFormData {
  roomName: string;
  measurementType: MeasurementType;
  length?: number;
  width?: number;
  height?: number;
  quantity?: number;
  deduction?: number;
  unitName: string;
  notes?: string;
}

const MEASUREMENT_TYPES: { value: MeasurementType; label: string }[] = [
  { value: 'AREA', label: 'Area' },
  { value: 'VOLUME', label: 'Volume' },
  { value: 'LENGTH', label: 'Length' },
  { value: 'PERIMETER', label: 'Perimeter' },
  { value: 'WEIGHT', label: 'Weight' },
  { value: 'CUSTOM', label: 'Custom' },
];

const DEFAULT_UNITS: Record<MeasurementType, string> = {
  AREA: 'sq.ft',
  VOLUME: 'cu.ft',
  LENGTH: 'ft',
  PERIMETER: 'ft',
  WEIGHT: 'kg',
  CUSTOM: 'unit',
};

function showLength(_type: MeasurementType): boolean {
  return true; // All types use the length field
}

function showWidth(type: MeasurementType): boolean {
  return type === 'AREA' || type === 'VOLUME' || type === 'PERIMETER';
}

function showHeight(type: MeasurementType): boolean {
  return type === 'VOLUME';
}

function getLengthLabel(type: MeasurementType): string {
  if (type === 'WEIGHT') return 'Weight Value';
  if (type === 'CUSTOM') return 'Value';
  return 'Length';
}

function computePreview(data: {
  measurementType: MeasurementType;
  length: number;
  width: number;
  height: number;
  quantity: number;
  deduction: number;
}): number {
  const { measurementType, length, width, height, quantity, deduction } = data;
  let raw = 0;
  switch (measurementType) {
    case 'AREA':
      raw = length * width;
      break;
    case 'VOLUME':
      raw = length * width * height;
      break;
    case 'LENGTH':
      raw = length;
      break;
    case 'PERIMETER':
      raw = 2 * (length + width);
      break;
    case 'WEIGHT':
      raw = length;
      break;
    case 'CUSTOM':
      raw = length;
      break;
  }
  return raw * quantity - deduction;
}

export function EntryForm({ open, onClose, onSubmit, entry, loading = false }: EntryFormProps) {
  const [roomName, setRoomName] = useState('');
  const [measurementType, setMeasurementType] = useState<MeasurementType>('AREA');
  const [length, setLength] = useState('');
  const [width, setWidth] = useState('');
  const [height, setHeight] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [deduction, setDeduction] = useState('0');
  const [unitName, setUnitName] = useState('sq.ft');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (entry) {
      setRoomName(entry.roomName);
      setMeasurementType(entry.measurementType);
      setLength(entry.length != null ? String(entry.length) : '');
      setWidth(entry.width != null ? String(entry.width) : '');
      setHeight(entry.height != null ? String(entry.height) : '');
      setQuantity(String(entry.quantity));
      setDeduction(String(entry.deduction));
      setUnitName(entry.unitName);
      setNotes(entry.notes || '');
    } else {
      setRoomName('');
      setMeasurementType('AREA');
      setLength('');
      setWidth('');
      setHeight('');
      setQuantity('1');
      setDeduction('0');
      setUnitName('sq.ft');
      setNotes('');
    }
  }, [entry, open]);

  const handleTypeChange = (type: MeasurementType) => {
    setMeasurementType(type);
    setUnitName(DEFAULT_UNITS[type]);
  };

  const preview = useMemo(() => {
    return computePreview({
      measurementType,
      length: parseFloat(length) || 0,
      width: parseFloat(width) || 0,
      height: parseFloat(height) || 0,
      quantity: parseInt(quantity, 10) || 1,
      deduction: parseFloat(deduction) || 0,
    });
  }, [measurementType, length, width, height, quantity, deduction]);

  const handleSubmit = async () => {
    const data: EntryFormData = {
      roomName,
      measurementType,
      length: length ? parseFloat(length) : undefined,
      width: width ? parseFloat(width) : undefined,
      height: height ? parseFloat(height) : undefined,
      quantity: parseInt(quantity, 10) || 1,
      deduction: parseFloat(deduction) || 0,
      unitName,
      notes: notes || undefined,
    };
    await onSubmit(data);
  };

  const isValid = roomName.trim() && unitName.trim();

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{entry ? 'Edit Entry' : 'Add Measurement Entry'}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField
            label="Room Name"
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
            required
            fullWidth
          />

          <TextField
            label="Measurement Type"
            select
            value={measurementType}
            onChange={(e) => handleTypeChange(e.target.value as MeasurementType)}
            fullWidth
          >
            {MEASUREMENT_TYPES.map((opt) => (
              <MenuItem key={opt.value} value={opt.value}>
                {opt.label}
              </MenuItem>
            ))}
          </TextField>

          <Grid container spacing={2}>
            {showLength(measurementType) && (
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  label={getLengthLabel(measurementType)}
                  type="number"
                  value={length}
                  onChange={(e) => setLength(e.target.value)}
                  fullWidth
                  slotProps={{ htmlInput: { step: 'any', min: 0 } }}
                />
              </Grid>
            )}
            {showWidth(measurementType) && (
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  label="Width"
                  type="number"
                  value={width}
                  onChange={(e) => setWidth(e.target.value)}
                  fullWidth
                  slotProps={{ htmlInput: { step: 'any', min: 0 } }}
                />
              </Grid>
            )}
            {showHeight(measurementType) && (
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  label="Height"
                  type="number"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  fullWidth
                  slotProps={{ htmlInput: { step: 'any', min: 0 } }}
                />
              </Grid>
            )}
          </Grid>

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                label="Quantity"
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                fullWidth
                slotProps={{ htmlInput: { min: 1, step: 1 } }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                label="Deduction"
                type="number"
                value={deduction}
                onChange={(e) => setDeduction(e.target.value)}
                fullWidth
                slotProps={{ htmlInput: { step: 'any', min: 0 } }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                label="Unit"
                value={unitName}
                onChange={(e) => setUnitName(e.target.value)}
                required
                fullWidth
              />
            </Grid>
          </Grid>

          <TextField
            label="Notes (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            fullWidth
            multiline
            rows={2}
          />

          {/* Computed value preview */}
          <Paper variant="outlined" sx={{ p: 2, bgcolor: 'action.hover' }}>
            <Typography variant="body2" color="text.secondary">
              Computed Value (Preview)
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {preview.toFixed(3)} {unitName}
            </Typography>
          </Paper>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={!isValid || loading}
        >
          {loading ? 'Saving...' : entry ? 'Update' : 'Add Entry'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
