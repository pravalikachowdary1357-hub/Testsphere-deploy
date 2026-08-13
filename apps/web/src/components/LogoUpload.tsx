import { useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import { Alert, Box, Button, IconButton, Typography } from '@mui/material';
import UploadFileOutlinedIcon from '@mui/icons-material/UploadFileOutlined';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import CorporateFareOutlinedIcon from '@mui/icons-material/CorporateFareOutlined';

const MAX_SOURCE_FILE_BYTES = 5 * 1024 * 1024;
const MAX_DIMENSION_PX = 256;

// Resizes/re-encodes client-side so the stored data URI stays small — the
// logo is saved as a plain string on Organization.logoUrl, no file storage
// or upload endpoint involved, so keeping it small matters for every future
// fetch of that row, not just this save.
function fileToLogoDataUri(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Unable to read this file.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("That file isn't a readable image."));
      img.onload = () => {
        const scale = Math.min(1, MAX_DIMENSION_PX / Math.max(img.width, img.height));
        const width = Math.max(1, Math.round(img.width * scale));
        const height = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Unable to process this image.'));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/png'));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

interface LogoUploadProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function LogoUpload({ label, value, onChange, disabled }: LogoUploadProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setError(null);
    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file.');
      return;
    }
    if (file.size > MAX_SOURCE_FILE_BYTES) {
      setError('That image is too large — please choose one under 5 MB.');
      return;
    }

    setIsProcessing(true);
    try {
      onChange(await fileToLogoDataUri(file));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to process this image.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Box>
      <Typography variant="caption" sx={{ display: 'block', mb: 0.75, color: 'text.secondary', fontWeight: 600 }}>
        {label}
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box
          sx={{
            width: 56,
            height: 56,
            borderRadius: 2,
            border: '1px solid rgba(11,36,48,0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            bgcolor: 'rgba(11,36,48,0.03)',
            flexShrink: 0,
          }}
        >
          {value ? (
            <Box component="img" src={value} alt="Logo preview" sx={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          ) : (
            <CorporateFareOutlinedIcon sx={{ color: 'rgba(11,36,48,0.3)' }} />
          )}
        </Box>
        <Button
          variant="outlined"
          size="small"
          startIcon={<UploadFileOutlinedIcon />}
          onClick={() => inputRef.current?.click()}
          disabled={disabled || isProcessing}
        >
          {isProcessing ? 'Processing…' : value ? 'Replace' : 'Upload logo'}
        </Button>
        {value && !disabled && (
          <IconButton size="small" onClick={() => onChange('')} disabled={isProcessing} aria-label="Remove logo">
            <DeleteOutlineOutlinedIcon fontSize="small" />
          </IconButton>
        )}
        <input ref={inputRef} type="file" accept="image/*" hidden onChange={handleFileChange} />
      </Box>
      {error && (
        <Alert severity="error" sx={{ mt: 1 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
    </Box>
  );
}
