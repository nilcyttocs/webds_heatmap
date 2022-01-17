import React, { useState } from 'react';

import Fab from '@mui/material/Fab';
import Stack from '@mui/material/Stack';
import Select from '@mui/material/Select';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import { ThemeProvider } from '@mui/material/styles';

import StopIcon from '@mui/icons-material/Stop';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';

import HeatmapPlot from './heatmap_component';

import webdsTheme from './webdsTheme';

const reportTypes = [
  'Delta Image',
  'Raw Image'
];

export const HeatmapMui = (props: any): JSX.Element => {
  const [reportType, setReportType] = useState<string>('');
  const [run, setRun] = useState<boolean>(false);

  const resetReportType = () => {
    setReportType('');
    setRun(false);
  };

  const changeReportType = (event: any) => {
    if (reportType !== event.target.value) {
      setReportType(event.target.value);
      if (event.target.value) {
        setRun(true);
      }
    }
  };

  return (
    <ThemeProvider theme={webdsTheme}>
      <div>
        <Stack
          spacing={5}
          divider={<Divider orientation='horizontal' sx={{width: 475}}/>}
          sx={{marginLeft: 5, marginTop: 5}}
        >
          <HeatmapPlot
            numCols={props.numCols}
            numRows={props.numRows}
            reportType={reportType}
            run={run}
            resetReportType={resetReportType}/>
          <Stack
            spacing={7}
            direction='row'
            sx={{height: 70}}
          >
            <FormControl
              size='small'
              sx={{width: 180, marginLeft: 3}}>
              <Select
                displayEmpty
                value={reportType}
                onChange={changeReportType}
                renderValue={(selected: any) => {
                  if (selected.length === 0) {
                    return <div style={{color: 'grey'}}><em>Report Type</em></div>;
                  }
                  return selected;
                }}
              >
                {reportTypes.map((reportType) => (
                  <MenuItem
                    key={reportType}
                    value={reportType}
                  >
                    {reportType}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {run === false ? (
              <Fab
                color='primary'
                size='small'
                disabled={!reportType}
                onClick={() => {setRun(true);}}
              >
                <PlayArrowIcon/>
              </Fab>
            ) : (
              <Fab
                color='primary'
                size='small'
                disabled={!reportType}
                onClick={() => {setRun(false);}}
              >
                <StopIcon/>
              </Fab>
            )}
          </Stack>
        </Stack>
      </div>
    </ThemeProvider>
  );
};
