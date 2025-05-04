import { Link as RouterLink } from 'react-router-dom';

// material-ui
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

export default function Footer() {
  return (
    <Stack
      direction="row"
      sx={{
        alignItems: 'center',
        justifyContent: 'space-between',
        pt: 3,
        mt: 'auto'
      }}
    >
      <Typography variant="caption">Daniel Flores-Martin &copy; All rights reserved </Typography>
      <Stack direction="row" sx={{ gap: 1.5, alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography component={Link} href="https://codedthemes.com/about-us/" underline="hover" target="_blank" color="secondary.main">
          Template by CodedThemes
        </Typography>
      </Stack>
    </Stack>
  );
}
