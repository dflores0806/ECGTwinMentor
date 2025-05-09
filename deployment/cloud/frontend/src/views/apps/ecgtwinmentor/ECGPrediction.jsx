import React, { useState, useEffect } from 'react';
import axios from 'axios';
import CryptoJS from 'crypto-js';
import {
  Grid,
  TextField,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Button,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Stack,
  Box
} from '@mui/material';

import RestartAltIcon from '@mui/icons-material/RestartAlt';
import InsightsIcon from '@mui/icons-material/Insights';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import ImageIcon from '@mui/icons-material/Image';
import SendIcon from '@mui/icons-material/Send';

import ECGGraph from './ECGGraph';

const secretKey = 'e4799ebc8be0f6bc973ab7fc966d6d4a';
const iv = CryptoJS.enc.Utf8.parse('trEMHBkonQFqJAIA');

const VITE_API_URL = import.meta.env.VITE_API_URL;

function encryptData(data) {
  const jsonData = JSON.stringify(data);
  const encrypted = CryptoJS.AES.encrypt(jsonData, CryptoJS.enc.Utf8.parse(secretKey), {
    iv: iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7
  });
  return encrypted.toString();
}

const rhythms = ['Sinus', 'Bradycardia', 'Tachycardia', 'Atrial Fibrillation'];
const tWaves = ['Normal', 'Inverted', 'Peaked', 'Flattened'];
const diagnoses = ['Normal', 'Bradycardia', 'Tachycardia', 'Atrial Fibrillation', 'Myocardial Infarction', 'Heart Block'];

const ECGPrediction = () => {
  const [inputs, setInputs] = useState({
    Heart_Rate: '',
    PR_Interval: '',
    QRS_Duration: '',
    ST_Segment: '',
    QTc_Interval: '',
    Electrical_Axis: '',
    Rhythm: 'Sinus',
    T_Wave: 'Normal'
  });

  const allInputsFilled = Object.values(inputs).every((value) => value !== '' && value !== null && value !== undefined);

  const [diagnosis, setDiagnosis] = useState('');
  const [modelPrediction, setModelPrediction] = useState('');
  const [exampleDiagnosis, setExampleDiagnosis] = useState('');
  const [selectedDiagnosis, setSelectedDiagnosis] = useState(null);
  const [ecgImage, setEcgImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showSimulatedECG, setShowSimulatedECG] = useState(false);
  const [selectedExample, setSelectedExample] = useState('');
  const [isEvaluateDisabled, setIsEvaluateDisabled] = useState(true);

  useEffect(() => {
    setIsEvaluateDisabled(!selectedExample || selectedExample === '');
  }, [selectedExample]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setInputs({ ...inputs, [name]: value });
  };

  const handlePredict = async () => {
    setLoading(true);
    try {
      const payload = {
        ...inputs,
        user_diagnosis: selectedDiagnosis
      };

      const encrypted = await encryptData(payload);
      const response = await axios.post(`${VITE_API_URL}/predict`, {
        data: encrypted
      });
      setModelPrediction(response.data.prediction);
    } catch (error) {
      setModelPrediction('Prediction error: ' + error);
    }
    setLoading(false);
  };

  const handleGenerateImage = async () => {
    setLoading(true);
    try {
      const encrypted = encryptData(inputs);
      const response = await axios.post(`${VITE_API_URL}/ecg/generate`, { data: encrypted }, { responseType: 'blob' });

      const blobUrl = URL.createObjectURL(response.data);
      setEcgImage(blobUrl);
      setDiagnosis('');
    } catch (error) {
      console.error('Error generating image:', error);
      setDiagnosis('Image generation error');
    }
    setLoading(false);
  };

  const getRandomFromArray = (arr) => arr[Math.floor(Math.random() * arr.length)];

  const handleFillExampleValues = () => {
    const diagnosis = getRandomFromArray(diagnoses);
    setInputs({
      Heart_Rate: (60 + Math.random() * 60).toFixed(1),
      PR_Interval: (120 + Math.random() * 80).toFixed(1),
      QRS_Duration: (80 + Math.random() * 40).toFixed(1),
      ST_Segment: (-1 + Math.random() * 3).toFixed(2),
      QTc_Interval: (360 + Math.random() * 100).toFixed(1),
      Electrical_Axis: (-30 + Math.random() * 150).toFixed(1),
      Rhythm: getRandomFromArray(rhythms),
      T_Wave: getRandomFromArray(tWaves)
    });
    setExampleDiagnosis(diagnosis);
    setModelPrediction(null);
  };

  const handleDiagnosisClick = (d) => {
    setSelectedDiagnosis(d);
  };

  const handleResetForm = () => {
    setInputs({
      Heart_Rate: '',
      PR_Interval: '',
      QRS_Duration: '',
      ST_Segment: '',
      QTc_Interval: '',
      Electrical_Axis: '',
      Rhythm: 'Sinus',
      T_Wave: 'Normal'
    });
    setModelPrediction('');
    setSelectedDiagnosis(null);
    setDiagnosis('');
    setEcgImage(null);
    setExampleDiagnosis('');
  };

  const fillExampleByDiagnosis = async (diagnosis) => {
    try {
      const response = await axios.post(`${VITE_API_URL}/samples/random`, {
        diagnosis
      });

      console.log(response.data);
      const data = response.data;
      if (data.error) {
        console.error(data.error);
        return;
      }

      setInputs({
        Heart_Rate: String(parseFloat(data.Heart_Rate).toFixed(2)),
        PR_Interval: String(parseFloat(data.PR_Interval).toFixed(2)),
        QRS_Duration: String(parseFloat(data.QRS_Duration).toFixed(2)),
        ST_Segment: String(parseFloat(data.ST_Segment).toFixed(2)),
        QTc_Interval: String(parseFloat(data.QTc_Interval).toFixed(2)),
        Electrical_Axis: String(parseFloat(data.Electrical_Axis).toFixed(2)),
        Rhythm: data.Rhythm,
        T_Wave: data.T_Wave
      });

      setShowSimulatedECG(true);
      setModelPrediction(null);
    } catch (error) {
      console.error('Failed to fetch example from backend:', error);
    }
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h3" gutterBottom sx={{ mb: 4 }}>
          ECGTwinMentor prediction
        </Typography>
        <Grid item xs={12}>
          <Typography variant="body1">
            ECGTwinMentor is an interactive educational tool designed to help users understand and evaluate electrocardiogram (ECG) patterns
            through digital simulation and AI-based diagnosis:
            <br />
            1️⃣ Fill in the ECG inputs manually or click "Fill Example Values" for realistic examples. <br />
            2️⃣ To test a specific condition, select it from the dropdown and click "Evaluate". <br />
            3️⃣ Click "Generate ECG Image" to visualize the signal in real time. <br />
            4️⃣ Choose your diagnosis below the image. <br />
            5️⃣ Click "Check" to compare your answer with the model’s prediction ✅❌.
          </Typography>
        </Grid>
        <Typography variant="h6" sx={{ mt: 4, mb: 1 }}>
          1. Enter ECG inputs
        </Typography>
        <Grid container spacing={2}>
          {Object.entries(inputs).map(([key, value]) =>
            ['Rhythm', 'T_Wave'].includes(key) ? (
              <Grid item xs={12} sm={6} md={3} key={key}>
                <FormControl fullWidth>
                  <InputLabel>{key.replace(/_/g, ' ')}</InputLabel>
                  <Select name={key} value={value} onChange={handleChange} label={key.replace(/_/g, ' ')}>
                    {(key === 'Rhythm' ? rhythms : tWaves).map((option) => (
                      <MenuItem key={option} value={option}>
                        {option}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            ) : (
              <Grid item xs={12} sm={6} md={3} key={key}>
                <TextField fullWidth name={key} label={key.replace(/_/g, ' ')} value={value} onChange={handleChange} />
              </Grid>
            )
          )}
        </Grid>

        <Stack direction="row" spacing={4} sx={{ mt: 2 }} useFlexGap flexWrap="wrap">
          {/* Columna 1 */}
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Fill random example
            </Typography>
            <Button variant="outlined" size="large" sx={{ height: 40 }} onClick={handleFillExampleValues} startIcon={<AutoFixHighIcon />}>
              Fill example values
            </Button>
          </Box>

          {/* Columna 2 */}
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Fill condition from dataset
            </Typography>
            <Stack direction="row" spacing={2}>
              <FormControl size="small">
                <Select
                  value={selectedExample}
                  onChange={(e) => setSelectedExample(e.target.value)}
                  displayEmpty
                  inputProps={{ 'aria-label': 'Select condition' }}
                  sx={{ height: 40 }}
                >
                  <MenuItem value="">Select condition</MenuItem>
                  <MenuItem value="Normal">Normal</MenuItem>
                  <MenuItem value="Bradycardia">Bradycardia</MenuItem>
                  <MenuItem value="Tachycardia">Tachycardia</MenuItem>
                  <MenuItem value="Atrial Fibrillation">Atrial Fibrillation</MenuItem>
                  <MenuItem value="Myocardial Infarction">Myocardial Infarction</MenuItem>
                  <MenuItem value="Heart Block">Heart Block</MenuItem>
                </Select>
              </FormControl>
              <Button
                size="large"
                sx={{ height: 40 }}
                variant="outlined"
                onClick={() => selectedExample && fillExampleByDiagnosis(selectedExample)}
                disabled={isEvaluateDisabled}
                startIcon={<InsightsIcon />}
              >
                Evaluate
              </Button>
            </Stack>
          </Box>
        </Stack>

        <Typography variant="h6" sx={{ mt: 4, mb: 1 }}>
          2. Generate ECG image
        </Typography>
        <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
          {/* 
          <Button variant="outlined" color="secondary" onClick={handleGenerateImage} disabled={!allInputsFilled} startIcon={<ImageIcon />}>
            Generate ECG image
          </Button>
          */}
          <Button
            variant="outlined"
            color="success"
            onClick={() => setShowSimulatedECG(true)}
            disabled={!allInputsFilled}
            startIcon={<ImageIcon />}
          >
            Generate ECG image
          </Button>
        </Stack>

        {ecgImage && (
          <>
            <h6 className="mt-4">Generated ECG (Backend)</h6>
            <div className="row">
              <div className="col-12">
                <img src={ecgImage} alt="Simulated ECG" className="img-fluid mt-2" style={{ marginTop: '20px', maxWidth: '100%' }} />
              </div>
            </div>
          </>
        )}
        <br/>
        {showSimulatedECG && <ECGGraph params={inputs} style={{ marginTop: '50px' }} />}

        <Typography variant="h6" sx={{ mt: 4, mb: 1 }}>
          3. Select diagnosis
        </Typography>
        <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
          {diagnoses.map((d) => (
            <Button
              key={d}
              variant={selectedDiagnosis === d ? 'contained' : 'outlined'}
              color={selectedDiagnosis === d ? 'primary' : 'inherit'}
              onClick={() => handleDiagnosisClick(d)}
            >
              {d}
            </Button>
          ))}
        </Stack>

        <Typography variant="h6" sx={{ mt: 4, mb: 1 }}>
          4. Submit data
        </Typography>
        <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
          <Button variant="contained" color="primary" onClick={handlePredict} disabled={!allInputsFilled} startIcon={<SendIcon />}>
            Check
          </Button>
          <Button variant="outlined" color="error" onClick={handleResetForm} startIcon={<RestartAltIcon />}>
            Reset form
          </Button>
        </Stack>
        {loading && <CircularProgress sx={{ mt: 2 }} />}

        {((modelPrediction && modelPrediction !== 'Prediction error') || selectedDiagnosis) && (
          <Box mt={4} p={2} border={1} borderRadius={2} borderColor="grey.300" bgcolor="#f9f9f9">
            <Typography variant="h6" gutterBottom>
              Results
            </Typography>
            <Typography>
              <strong>Model Prediction:</strong> {modelPrediction || 'None'}
            </Typography>
            <Typography>
              <strong>User Diagnosis:</strong> {selectedDiagnosis || 'None'}
            </Typography>
            <Typography>
              <strong>Result:</strong>{' '}
              {selectedDiagnosis && modelPrediction ? (
                selectedDiagnosis === modelPrediction ? (
                  <span style={{ color: 'green' }}>Correct ✅</span>
                ) : (
                  <span style={{ color: 'red' }}>Incorrect ❌</span>
                )
              ) : (
                'Not evaluated'
              )}
            </Typography>
          </Box>
        )}

        {diagnosis && (
          <Typography variant="h6" sx={{ mt: 2 }}>
            Diagnosis: {diagnosis}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};

export default ECGPrediction;
