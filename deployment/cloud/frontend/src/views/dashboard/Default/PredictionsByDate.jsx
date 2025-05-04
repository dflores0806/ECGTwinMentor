import PropTypes from 'prop-types';
import { useTheme } from '@mui/material/styles';
import { Grid } from '@mui/material';
import { Line } from 'react-chartjs-2';

import MainCard from 'ui-component/cards/MainCard';
import { Chart as ChartJS, LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Legend);

const PredictionsByDate = ({ data }) => {
  const theme = useTheme();
  const labels = Object.keys(data);

  const correctData = labels.map((key) => data[key].correct || 0);
  const incorrectData = labels.map((key) => data[key].incorrect || 0);

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Correct',
        data: correctData,
        borderColor: theme.palette.success.main,
        backgroundColor: theme.palette.success.light,
        tension: 0.3,
        fill: false
      },
      {
        label: 'Incorrect',
        data: incorrectData,
        borderColor: theme.palette.error.main,
        backgroundColor: theme.palette.error.light,
        tension: 0.3,
        fill: false
      }
    ]
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
        labels: { color: theme.palette.text.primary }
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: theme.palette.text.primary }
      },
      y: {
        beginAtZero: true,
        grid: { color: theme.palette.divider },
        ticks: { color: theme.palette.text.primary }
      }
    }
  };

  return (
    <MainCard title="Predictions by date">
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Line data={chartData} options={options} height={300} />
        </Grid>
      </Grid>
    </MainCard>
  );
};

PredictionsByDate.propTypes = {
  data: PropTypes.object.isRequired
};

export default PredictionsByDate;
