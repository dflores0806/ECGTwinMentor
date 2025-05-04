import PropTypes from 'prop-types';
import { useTheme } from '@mui/material/styles';
import { Box, Typography, Grid, LinearProgress } from '@mui/material';
import MainCard from 'ui-component/cards/MainCard';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';

const PredictionAccuracyCard = ({ accuracy }) => {
  const theme = useTheme();
  const percentage = Math.round(accuracy * 100);

  return (
    <MainCard>
      <Grid container spacing={2} alignItems="center">
        <Grid item>
          <TrendingUpIcon sx={{ fontSize: 40, color: theme.palette.success.main }} />
        </Grid>
        <Grid item xs>
          <Typography variant="h6">Users prediction accuracy</Typography>
          <Box display="flex" alignItems="center" gap={1} mt={0.5}>
            <Typography variant="h4" color="textPrimary">
              {percentage}%
            </Typography>
          </Box>
          <LinearProgress variant="determinate" value={percentage} sx={{ mt: 1, height: 10, borderRadius: 5 }} color="success" />
        </Grid>
      </Grid>
    </MainCard>
  );
};

PredictionAccuracyCard.propTypes = {
  accuracy: PropTypes.number.isRequired
};

export default PredictionAccuracyCard;
