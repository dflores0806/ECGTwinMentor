import PropTypes from 'prop-types';
import { useTheme } from '@mui/material/styles';
import { Box, Typography, Grid } from '@mui/material';
import MainCard from 'ui-component/cards/MainCard';
import BarChartIcon from '@mui/icons-material/BarChart';

const MostCommonDiagnosisCard = ({ data }) => {
  const theme = useTheme();

  const entries = Object.entries(data || {});
  if (entries.length === 0) {
    return (
      <MainCard>
        <Typography variant="h6">Most Evaluated Diagnosis</Typography>
        <Typography variant="body2" color="textSecondary">
          No data available
        </Typography>
      </MainCard>
    );
  }

  const mostCommon = entries.reduce((max, current) => (current[1] > max[1] ? current : max));

  return (
    <MainCard>
      <Grid container spacing={2} alignItems="center">
        <Grid item>
          <BarChartIcon sx={{ fontSize: 40, color: theme.palette.info.main }} />
        </Grid>
        <Grid item xs>
          <Typography variant="h6">Most Evaluated Diagnosis</Typography>
          <Box mt={0.5}>
            <Typography variant="h4" color="textPrimary">
              {mostCommon[0]}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              {mostCommon[1]} evaluations
            </Typography>
          </Box>
        </Grid>
      </Grid>
    </MainCard>
  );
};

MostCommonDiagnosisCard.propTypes = {
  data: PropTypes.object.isRequired
};

export default MostCommonDiagnosisCard;
