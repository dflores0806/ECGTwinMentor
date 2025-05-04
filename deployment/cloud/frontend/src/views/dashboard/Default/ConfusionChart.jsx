import PropTypes from 'prop-types';
import { useTheme } from '@mui/material/styles';
import { Grid } from '@mui/material';
import { Bar } from 'react-chartjs-2';
import MainCard from 'ui-component/cards/MainCard';
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

const ConfusionChart = ({ data }) => {
  const theme = useTheme();
  const labels = data.map((item) => `${item.user} → ${item.model}`);
  const counts = data.map((item) => item.count);

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Incorrect Predictions',
        data: counts,
        backgroundColor: theme.palette.error.main,
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
          label: (context) => ` ${context.parsed.y} mistakes`
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
    <MainCard title="Top confusion pairs">
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Bar data={chartData} options={options} height={300} />
        </Grid>
      </Grid>
    </MainCard>
  );
};

ConfusionChart.propTypes = {
  data: PropTypes.arrayOf(
    PropTypes.shape({
      user: PropTypes.string.isRequired,
      model: PropTypes.string.isRequired,
      count: PropTypes.number.isRequired
    })
  ).isRequired
};

export default ConfusionChart;
