import { useState } from 'react';
import { Button, Grid, Typography, Dialog, DialogTitle, DialogContent, DialogActions, Card, CardContent } from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import DownloadIcon from '@mui/icons-material/Download';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import axios from 'axios';

const Settings = () => {
  const [open, setOpen] = useState(false);
  const user = JSON.parse(localStorage.getItem('user'));

  const handleClearStatistics = async () => {
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/stats`, {
        headers: {
          'X-Token': user.token
        }
      });
      alert('Statistics file cleared successfully');
    } catch (error) {
      console.error('Error clearing statistics:', error);
      alert('Failed to clear statistics file');
    } finally {
      setOpen(false);
    }
  };

  const handleDownloadModel = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/models/tflite/download`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'model.tflite');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error downloading model:', error);
      alert('Failed to download TFLite model');
    }
  };

  const handleExportStatistics = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/stats/export/csv`, {
        responseType: 'blob',
        headers: {
          'X-Token': user.token
        }
      });
      const contentDisposition = response.headers['content-disposition'];
      const match = contentDisposition?.match(/filename="?(.+)"?/);
      const filename = match?.[1] || 'statistics.csv';

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error exporting statistics:', error);
      alert('Failed to export statistics');
    }
  };

  return (
    <Card>
      <CardContent>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Typography variant="h3" gutterBottom>
              Settings
            </Typography>
            <Typography variant="body2" color="textSecondary">
              This section allows you to manage core application resources. You can clear all stored prediction statistics or download the
              currently active TFLite model for deployment on edge devices.
            </Typography>
          </Grid>

          <Grid item xs={12}>
            <Typography variant="body2" color="textSecondary" gutterBottom>
              Export all recorded statistics as a CSV file.
            </Typography>
            <Button variant="contained" color="secondary" startIcon={<FileDownloadIcon />} onClick={handleExportStatistics}>
              Export Statistics (CSV)
            </Button>
          </Grid>

          <Grid item xs={12}>
            <Typography variant="body2" color="textSecondary" gutterBottom>
              This will erase all stored prediction statistics.
            </Typography>
            <Button variant="contained" color="error" startIcon={<DeleteOutlineIcon />} onClick={() => setOpen(true)}>
              Clear Statistics
            </Button>
          </Grid>

          <Grid item xs={12}>
            <Typography variant="body2" color="textSecondary" gutterBottom>
              Download the currently active TFLite model file.
            </Typography>
            <Button variant="contained" color="primary" startIcon={<DownloadIcon />} onClick={handleDownloadModel}>
              Download TFLite Model
            </Button>
          </Grid>

          {/* Confirm Dialog */}
          <Dialog open={open} onClose={() => setOpen(false)}>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogContent>Are you sure you want to clear all statistics? This action cannot be undone.</DialogContent>
            <DialogActions>
              <Button onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={handleClearStatistics} color="error" variant="contained">
                Confirm
              </Button>
            </DialogActions>
          </Dialog>
        </Grid>
      </CardContent>
    </Card>
  );
};

export default Settings;
