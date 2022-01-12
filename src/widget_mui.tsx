import React, { useState } from 'react';

import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import { ThemeProvider } from '@mui/material/styles';

import HeatmapPlot from './heatmap_component';

import webdsTheme from './webdsTheme';

export const HeatmapMui = (props:any): JSX.Element => {
  const [reportType, setReportType] = useState<string>('');

  const resetReportType = () => {
    setReportType('');
  };

  return (
    <ThemeProvider theme={webdsTheme}>
      <div>
        <Stack
          spacing={5}
          divider={<Divider orientation='horizontal' sx={{width:475}}/>}
          sx={{marginLeft:5, marginTop:5}}
        >
          <Stack
            spacing={2}
            direction="row"
          >
            <Button
              variant="contained"
              onClick={() => {setReportType('Delta Image');}}
              sx={{minWidth:100, maxWidth:100, marginRight:2}}
            >
              Delta
            </Button>
            <Button
              variant="contained"
              onClick={() => {setReportType('Raw Image');}}
              sx={{minWidth:100, maxWidth:100, marginRight:2}}
            >
              Raw
            </Button>
          </Stack>
          <HeatmapPlot reportType={reportType} resetReportType={resetReportType}/>
        </Stack>
      </div>
    </ThemeProvider>
  );
};
