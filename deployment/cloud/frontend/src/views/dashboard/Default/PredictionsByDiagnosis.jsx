import PropTypes from 'prop-types';
import { useTheme } from '@mui/material/styles';
import MainCard from 'ui-component/cards/MainCard';
import { Grid, Typography } from '@mui/material';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js';

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

const PredictionsByDiagnosis = ({ data }) => {
  const theme = useTheme();

  const chartData = {
    labels: Object.keys(data),
    datasets: [
      {
        label: 'Predictions',
        data: Object.values(data),
        backgroundColor: theme.palette.primary.main,
        borderRadius: 4,
        barThickness: 24
      }
    ]
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context) => ` ${context.parsed.y} predictions`
        }
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
    <MainCard title="Predictions by diagnosis">
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Bar data={chartData} options={options} height={300} />
        </Grid>
      </Grid>
    </MainCard>
  );
};

PredictionsByDiagnosis.propTypes = {
  data: PropTypes.object.isRequired
};

export default PredictionsByDiagnosis;
