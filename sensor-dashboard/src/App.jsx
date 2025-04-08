import { useState, useEffect } from 'react'
import { 
  Box, 
  Container, 
  Typography, 
  Paper, 
  Grid,
  IconButton,
  Card,
  CardContent,
  Button,
  Divider,
  useTheme,
  useMediaQuery,
  ThemeProvider,
  createTheme,
  CssBaseline,
  CircularProgress
} from '@mui/material'
import {
  Speed as SpeedIcon,
  Vibration as VibrationIcon,
  Straighten as StraightenIcon,
  Timeline as TimelineIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  Dashboard as DashboardIcon
} from '@mui/icons-material'
import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js'
import axios from 'axios'
import './App.css'

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
)

// Create a light theme
const lightTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#f7f9fc',
      paper: '#ffffff'
    },
    text: {
      primary: '#2d3748',
      secondary: '#4a5568'
    }
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 700,
    },
    h5: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 500,
    }
  },
  shape: {
    borderRadius: 8
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)'
        }
      }
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)'
        }
      }
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500
        }
      }
    }
  }
});

function App() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [sensorData, setSensorData] = useState([])
  const [latestData, setLatestData] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchData = async () => {
    setLoading(true)
    try {
      const response = await axios.get('http://localhost:3000/api/sensor-data?limit=20')
      setSensorData(response.data.data.reverse())
      if (response.data.data.length > 0) {
        setLatestData(response.data.data[0])
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 5000) // Refresh every 5 seconds
    return () => clearInterval(interval)
  }, [])

  const handleDownload = async () => {
    try {
      window.open('http://localhost:3000/api/sensor-data/download', '_blank')
    } catch (error) {
      console.error('Error downloading data:', error)
    }
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      title: {
        display: true,
        font: {
          size: 14,
          weight: 'normal'
        },
        color: '#4a5568',
        padding: {
          bottom: 10
        }
      }
    },
    scales: {
      y: { 
        beginAtZero: true,
        ticks: {
          font: {
            size: 11,
          },
          color: '#718096'
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        }
      },
      x: {
        ticks: {
          font: {
            size: 10,
          },
          maxRotation: 45,
          minRotation: 45,
          color: '#718096'
        },
        grid: {
          display: false
        }
      }
    },
    animation: { duration: 500 }
  }

  const getChartData = (label, data, color) => {
    return {
      labels: sensorData.map(d => d.timestamp.split(' ')[1]),
      datasets: [
        {
          label,
          data: sensorData.map(d => d[data]),
          borderColor: color,
          backgroundColor: `${color}15`,
          tension: 0.3,
          fill: true,
          pointRadius: 3,
          pointHoverRadius: 5,
          borderWidth: 2
        }
      ]
    }
  }

  const SensorCard = ({ title, value, icon, color }) => (
    <Card sx={{ 
      height: '100%', 
      borderTop: `4px solid ${color}`,
      borderRadius: 2,
      transition: 'transform 0.2s, box-shadow 0.2s',
      '&:hover': {
        transform: 'translateY(-4px)',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)'
      }
    }}>
      <CardContent>
        <Box display="flex" alignItems="center" mb={1}>
          <Box 
            sx={{ 
              bgcolor: `${color}15`, 
              p: 1, 
              borderRadius: 1.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mr: 1.5
            }}
          >
            {icon}
          </Box>
          <Typography variant="h6" color="text.secondary">
            {title}
          </Typography>
        </Box>
        <Divider sx={{ my: 1.5 }} />
        <Box display="flex" alignItems="baseline">
          <Typography variant="h4" fontWeight="bold" color="text.primary">
            {value?.toFixed(2) || '---'}
          </Typography>
          {value && (
            <Typography variant="body2" ml={1} color="text.secondary">
              units
            </Typography>
          )}
        </Box>
      </CardContent>
    </Card>
  )

  const SensorChart = ({ title, dataKey, color }) => (
    <Paper sx={{ 
      p: 3, 
      height: 280,
      borderRadius: 2,
      overflow: 'hidden',
      position: 'relative'
    }}>
      <Typography 
        variant="h6" 
        fontWeight="medium" 
        mb={2} 
        color="text.primary"
        sx={{
          display: 'flex',
          alignItems: 'center',
          '&::before': {
            content: '""',
            display: 'block',
            width: 12,
            height: 12,
            borderRadius: '50%',
            bgcolor: color,
            mr: 1.5
          }
        }}
      >
        {title}
      </Typography>
      <Box sx={{ height: 210 }}>
        {loading && sensorData.length === 0 ? (
          <Box 
            sx={{ 
              height: '100%', 
              display: 'flex', 
              alignItems: 'center',
              justifyContent: 'center' 
            }}
          >
            <CircularProgress size={40} />
          </Box>
        ) : (
          <Line 
            options={{
              ...chartOptions,
              plugins: {
                ...chartOptions.plugins,
                title: {
                  ...chartOptions.plugins.title,
                  text: `${title} Readings (Last 20 measurements)`
                }
              }
            }} 
            data={getChartData(title, dataKey, color)} 
          />
        )}
      </Box>
    </Paper>
  )

  return (
    <ThemeProvider theme={lightTheme}>
      <CssBaseline />
      <Box sx={{ 
        minHeight: '100vh',
        background: 'linear-gradient(165deg, #f7f9fc 0%, #e8eef8 100%)',
        pb: 6
      }}>
        <Container maxWidth="xl">
          <Box sx={{ py: 4 }}>
            <Box display="flex" 
              justifyContent="space-between" 
              alignItems="center" 
              mb={4} 
              flexDirection={isMobile ? 'column' : 'row'}
              gap={isMobile ? 2 : 0}
            >
              <Box display="flex" alignItems="center">
                <DashboardIcon sx={{ 
                  mr: 1.5, 
                  fontSize: 40, 
                  color: '#1976d2',
                  bgcolor: 'rgba(25, 118, 210, 0.1)',
                  p: 1,
                  borderRadius: 2
                }} />
                <Box>
                  <Typography variant="h4" component="h1" color="text.primary">
                    Structural Health Monitoring
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    Real-time sensor data visualization dashboard
                  </Typography>
                </Box>
              </Box>
              <Box display="flex" alignItems="center">
                <IconButton 
                  onClick={fetchData} 
                  sx={{ 
                    mr: 1.5,
                    bgcolor: 'rgba(25, 118, 210, 0.08)',
                    '&:hover': { bgcolor: 'rgba(25, 118, 210, 0.15)' },
                    width: 42,
                    height: 42
                  }}
                  disabled={loading}
                >
                  {loading ? (
                    <CircularProgress size={20} />
                  ) : (
                    <RefreshIcon />
                  )}
                </IconButton>
                <Button 
                  variant="contained" 
                  startIcon={<DownloadIcon />}
                  onClick={handleDownload}
                  sx={{
                    px: 2.5,
                    py: 1,
                    boxShadow: '0 4px 12px rgba(25, 118, 210, 0.2)'
                  }}
                  disableElevation
                >
                  Download Data
                </Button>
              </Box>
            </Box>

            <Grid container spacing={3} mb={4}>
              <Grid item xs={12} sm={6} md={3}>
                <SensorCard
                  title="Strain"
                  value={latestData?.strain}
                  icon={<SpeedIcon sx={{ color: '#4CAF50' }} />}
                  color="#4CAF50"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <SensorCard
                  title="Vibration"
                  value={latestData?.vibration}
                  icon={<VibrationIcon sx={{ color: '#2196F3' }} />}
                  color="#2196F3"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <SensorCard
                  title="Displacement"
                  value={latestData?.displacement}
                  icon={<StraightenIcon sx={{ color: '#FFC107' }} />}
                  color="#FFC107"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <SensorCard
                  title="Acceleration"
                  value={latestData?.acceleration}
                  icon={<TimelineIcon sx={{ color: '#F44336' }} />}
                  color="#F44336"
                />
              </Grid>
            </Grid>

            <Box sx={{ 
              mb: 3, 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center' 
            }}>
              <Typography variant="h5" color="text.primary">
                Sensor Data Trends
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Updated {latestData?.timestamp ? `on ${latestData.timestamp}` : 'just now'}
              </Typography>
            </Box>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <SensorChart 
                  title="Strain" 
                  dataKey="strain" 
                  color="#4CAF50" 
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <SensorChart 
                  title="Vibration" 
                  dataKey="vibration" 
                  color="#2196F3" 
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <SensorChart 
                  title="Displacement" 
                  dataKey="displacement" 
                  color="#FFC107" 
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <SensorChart 
                  title="Acceleration" 
                  dataKey="acceleration" 
                  color="#F44336" 
                />
              </Grid>
            </Grid>
          </Box>
        </Container>
      </Box>
    </ThemeProvider>
  )
}

export default App