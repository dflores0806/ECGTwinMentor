import PropTypes from 'prop-types';
import { useTheme } from '@mui/material/styles';
import { Box, Typography, Grid, Divider } from '@mui/material';
import MainCard from 'ui-component/cards/MainCard';
import AssessmentIcon from '@mui/icons-material/Assessment';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';

const PredictionCountCard = ({ total, correct, incorrect }) => {
  const theme = useTheme();

  return (
    <MainCard>
      <Grid container spacing={2} alignItems="center">
        <Grid item>
          <AssessmentIcon sx={{ fontSize: 40, color: theme.palette.primary.main }} />
        </Grid>
        <Grid item xs>
          <Typography variant="h6">Total Predictions</Typography>
          <Box display="flex" alignItems="center" gap={1} mt={0.5}>
            <Typography variant="h4" color="textPrimary">
              {total}
            </Typography>
          </Box>
          <Divider sx={{ my: 1 }} />
          <Box display="flex" justifyContent="space-between">
            <Box display="flex" alignItems="center" gap={1}>
              <CheckCircleIcon color="success" />
              <Typography variant="body2" color="success.main">
                {correct} correct
              </Typography>
            </Box>
            <Box display="flex" alignItems="center" gap={1}>
              <HighlightOffIcon color="error" />
              <Typography variant="body2" color="error.main">
                {incorrect} incorrect
              </Typography>
            </Box>
          </Box>
        </Grid>
      </Grid>
    </MainCard>
  );
};

PredictionCountCard.propTypes = {
  total: PropTypes.number.isRequired,
  correct: PropTypes.number.isRequired,
  incorrect: PropTypes.number.isRequired
};

export default PredictionCountCard;
