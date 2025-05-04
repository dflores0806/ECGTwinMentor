import { useEffect, useState } from 'react';
import axios from 'axios';
import { Grid, Card, CardContent, Typography } from '@mui/material';

import PredictionsByDiagnosis from './PredictionsByDiagnosis';
import PredictionAccuracyCard from './PredictionAccuracyCard';
import PredictionsByDate from './PredictionsByDate';
import ConfusionChart from './ConfusionChart';
import PredictionCountCard from './PredictionCountCard';
import MostCommonDiagnosisCard from './MostCommonDiagnosisCard';
import MostConfusedPairCard from './MostConfusedPairCard';

const Dashboard = () => {
  const [stats, setStats] = useState(null);

  const incorrectCount = stats?.confusions.reduce((acc, c) => acc + c.count, 0);
  const correctCount = stats?.total - incorrectCount;

  useEffect(() => {
    axios
      .get(`${import.meta.env.VITE_API_URL}/stats/summary`)
      .then((res) => setStats(res.data))
      .catch(console.error);
  }, []);

  return (
    <Card>
      <CardContent>
        <Typography variant="h1" gutterBottom sx={{ mb: 4 }}>
          Welcome to ECGTwinMentor
        </Typography>

        <Grid container spacing={3}>
          {stats && (
            <>
              {/* Mensaje de bienvenida */}
              <Grid item xs={12}>
                <Typography variant="body1">
                  ECGTwinMentor is an advanced clinical simulation and educational platform designed to enhance the understanding of
                  electrocardiographic patterns through predictive modeling and digital twin technology. It allows users to input ECG
                  parameters, receive AI-based diagnostic predictions, evaluate diagnostic accuracy, and visualize simulated ECG waveforms
                  in real-time. The system also tracks performance over time, enabling data-driven learning and refinement of clinical
                  reasoning.
                </Typography>
              </Grid>

              {/* Cards de resumen */}
              <Grid item xs={12} md={3}>
                <PredictionAccuracyCard accuracy={stats.accuracy} />
              </Grid>

              <Grid item xs={12} md={3}>
                <PredictionCountCard total={stats.total} correct={correctCount ?? 0} incorrect={incorrectCount ?? 0} />
              </Grid>

              <Grid item xs={12} md={3}>
                <MostCommonDiagnosisCard data={stats.by_diagnosis} />
              </Grid>

              <Grid item xs={12} md={3}>
                <MostConfusedPairCard data={stats.confusions} />
              </Grid>

              {/* Gráficos */}
              <Grid item xs={12} md={4}>
                <PredictionsByDiagnosis data={stats.by_diagnosis} />
              </Grid>

              <Grid item xs={12} md={4}>
                <PredictionsByDate data={stats.by_date} />
              </Grid>

              <Grid item xs={12} md={4}>
                <ConfusionChart data={stats.confusions} />
              </Grid>
            </>
          )}
        </Grid>
      </CardContent>
    </Card>
  );
};

export default Dashboard;
