import React, { useEffect, useRef, useState } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, LineElement, LinearScale, PointElement, CategoryScale, Filler } from 'chart.js';

ChartJS.register(LineElement, LinearScale, PointElement, CategoryScale, Filler);

const generateECGWaveform = (params = {}) => {
  const {
    Heart_Rate = 75,
    PR_Interval = 160,
    QRS_Duration = 100,
    ST_Segment = 0.1,
    QTc_Interval = 400,
    Electrical_Axis = 0,
    Rhythm = 'Sinus',
    T_Wave = 'Normal'
  } = params;

  const duration = 3;
  const samplingRate = 500;
  const samples = duration * samplingRate;
  const ecg = [];

  const beatInterval = (60 / Heart_Rate) * samplingRate;
  const qrsWidth = Math.max(3, Math.floor((QRS_Duration / 1000) * samplingRate));
  const prDelay = Math.floor((PR_Interval / 1000) * samplingRate);
  const tWaveWidth = Math.floor((QTc_Interval / 1000) * samplingRate) - qrsWidth - prDelay;

  for (let i = 0; i < samples; i++) {
    const t = i % beatInterval;
    let value = 0;

    // P wave before QRS
    if (t >= prDelay - 30 && t < prDelay - 10) {
      const pt = t - (prDelay - 30);
      const pWidth = 20;
      const pAmp = 0.15;
      value = pAmp * Math.sin((Math.PI * pt) / pWidth);
    }
    // QRS complex
    else if (t >= prDelay && t < prDelay + qrsWidth) {
      const qrsT = t - prDelay;
      // Simulación más realista del complejo QRS con forma aguda
      const rPeak = 1.5;
      const qAmp = -0.3;
      const sAmp = -0.5;
      const segment = qrsWidth / 5;
      if (qrsT < segment) {
        value = qAmp * Math.sin((Math.PI * qrsT) / segment);
      } else if (qrsT < 2 * segment) {
        value = rPeak * Math.sin((Math.PI * (qrsT - segment)) / segment);
      } else if (qrsT < 3 * segment) {
        value = sAmp * Math.sin((Math.PI * (qrsT - 2 * segment)) / segment);
      } else {
        value = 0;
      }
    }
    // ST segment (flat line)
    else if (t >= prDelay + qrsWidth && t < prDelay + qrsWidth + 10) {
      value = ST_Segment;
    }
    // T wave
    else if (t >= prDelay + qrsWidth + 10 && t < prDelay + qrsWidth + 10 + tWaveWidth) {
      const tt = t - (prDelay + qrsWidth + 10);
      let amp = 0.2;
      if (T_Wave === 'Inverted') amp = -0.2;
      else if (T_Wave === 'Peaked') amp = 0.35;
      else if (T_Wave === 'Flattened') amp = 0.1;
      const width = tWaveWidth;
      value = amp * Math.sin((Math.PI * tt) / width);
    }
    // U wave (visible in bradycardia or prolonged QT)
    else if (
      (Rhythm === 'Bradycardia' || QTc_Interval > 450) &&
      t >= prDelay + qrsWidth + 10 + tWaveWidth &&
      t < prDelay + qrsWidth + 10 + tWaveWidth + 20
    ) {
      const ut = t - (prDelay + qrsWidth + 10 + tWaveWidth);
      value = 0.05 * Math.sin((Math.PI * ut) / 20);
    }

    // Electrical axis as baseline offset
    const offset = (Electrical_Axis / 180) * 0.3;
    value += offset;

    // Rhythm pattern (irregularity simulation)
    if (Rhythm === 'Atrial Fibrillation' && Math.random() < 0.01) {
      value += (Math.random() - 0.5) * 1.5;
    } else if (Rhythm === 'Bradycardia') {
      value *= 0.8;
    } else if (Rhythm === 'Tachycardia') {
      value *= 1.1;
    }

    ecg.push({ x: i / samplingRate, y: value });
  }

  return ecg;
};

const ECGGraph = ({ params }) => {
  const [dataPoints, setDataPoints] = useState([]);
  const fullData = useRef([]);
  const index = useRef(0);

  useEffect(() => {
    fullData.current = generateECGWaveform(params);
    setDataPoints([]);
    index.current = 0;

    let interval;

    const startAnimation = () => {
      setDataPoints([]);
      index.current = 0;

      interval = setInterval(() => {
        if (index.current >= fullData.current.length) {
          clearInterval(interval);
          setTimeout(startAnimation, 200); // loop after short pause
          return;
        }
        setDataPoints((prev) => [...prev, fullData.current[index.current]]);
        index.current++;
      }, 5);
    };

    startAnimation(); // ~200Hz speed

    return () => clearInterval(interval);
  }, [params]);

  const chartData = {
    labels: fullData.current.map((p) => p.x.toFixed(2)),
    datasets: [
      {
        label: 'ECG Signal',
        data: fullData.current.map((p, i) => (i < dataPoints.length ? p.y : null)),
        fill: false,
        borderColor: 'red',
        tension: 0.2,
        pointRadius: 0
      },
      {
        label: 'Time Marker',
        data: fullData.current.map((_, i) => (i === dataPoints.length ? (dataPoints.length % 10 < 5 ? 2 : null) : null)),
        borderColor: 'blue',
        borderWidth: 1,
        pointRadius: 0,
        showLine: true
      }
    ]
  };

  const options = {
    animation: false,
    scales: {
      x: {
        type: 'linear',
        title: { display: true, text: 'Time (s)' }
      },
      y: {
        title: { display: true, text: 'Amplitude (mV)' },
        suggestedMin: -1,
        suggestedMax: 2
      }
    },
    plugins: {
      legend: { display: false }
    },
    maintainAspectRatio: false
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', maxHeight: '300px' }}>
      <Line data={chartData} options={options} style={{ width: '100%', maxHeight: '180px' }} />
    </div>
  );
};

export default ECGGraph;
