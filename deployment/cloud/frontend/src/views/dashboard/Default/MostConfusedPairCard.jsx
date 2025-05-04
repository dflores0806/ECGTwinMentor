import PropTypes from 'prop-types';
import { useTheme } from '@mui/material/styles';
import { Box, Typography, Grid } from '@mui/material';
import MainCard from 'ui-component/cards/MainCard';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';

const MostConfusedPairCard = ({ data }) => {
  const theme = useTheme();

  if (!data.length) return null;

  const [mostConfused] = data;

  return (
    <MainCard>
      <Grid container spacing={2} alignItems="center">
        <Grid item>
          <CompareArrowsIcon sx={{ fontSize: 40, color: theme.palette.warning.main }} />
        </Grid>
        <Grid item xs>
          <Typography variant="h6">Most confused diagnosis</Typography>
          <Box mt={0.5}>
            <Typography variant="h5" color="textPrimary">
              {mostConfused.user} → {mostConfused.model}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              {mostConfused.count} times confused
            </Typography>
          </Box>
        </Grid>
      </Grid>
    </MainCard>
  );
};

MostConfusedPairCard.propTypes = {
  data: PropTypes.arrayOf(
    PropTypes.shape({
      user: PropTypes.string.isRequired,
      model: PropTypes.string.isRequired,
      count: PropTypes.number.isRequired
    })
  ).isRequired
};

export default MostConfusedPairCard;
