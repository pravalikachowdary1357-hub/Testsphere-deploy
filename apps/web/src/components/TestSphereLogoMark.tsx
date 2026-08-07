import { Box } from '@mui/material';
import testSphereLogo from '../assets/testsphere-logo.jpeg';

// testsphere-logo.jpeg bakes the wordmark into a 1280x1280 canvas with huge
// white padding around it (real content is only this box, in source pixels).
const SOURCE_SIZE = 1280;
const CROP = { left: 362, top: 571, width: 474, height: 97 };

interface TestSphereLogoMarkProps {
  height?: number;
  /** Wrap in a white badge — needed when placed on a dark surface, since the
   * source JPEG has an opaque white background baked in, not transparency. */
  onDark?: boolean;
}

export function TestSphereLogoMark({ height = 32, onDark = false }: TestSphereLogoMarkProps) {
  const scale = height / CROP.height;
  const imgSize = SOURCE_SIZE * scale;
  const width = CROP.width * scale;

  const crop = (
    <Box sx={{ width, height, overflow: 'hidden', position: 'relative', flexShrink: 0 }}>
      <Box
        component="img"
        src={testSphereLogo}
        alt="TestSphere"
        sx={{
          position: 'absolute',
          top: -(CROP.top * scale),
          left: -(CROP.left * scale),
          width: imgSize,
          height: imgSize,
          maxWidth: 'none',
        }}
      />
    </Box>
  );

  if (!onDark) {
    return crop;
  }

  return (
    <Box sx={{ display: 'inline-flex', bgcolor: '#fff', borderRadius: 1.5, px: 1.25, py: 0.75 }}>
      {crop}
    </Box>
  );
}
