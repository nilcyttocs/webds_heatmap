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
  'Raw Image',
  'Baseline Image'
];

export const HeatmapMui = (props: any): JSX.Element => {
  const [run, setRun] = useState<boolean>(false);
  const [reportType, setReportType] = useState<string>('');

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
          divider={<Divider orientation='horizontal' sx={{width: '500px'}}/>}
          sx={{marginLeft: '50px', marginTop: '50px'}}
        >
          <HeatmapPlot
            run={run}
            numCols={props.numCols}
            numRows={props.numRows}
            reportType={reportType}
            resetReportType={resetReportType}/>
          <Stack
            spacing={7}
            direction='row'
            sx={{height: '70px'}}
          >
            <Stack
              spacing={1}
              direction='row'
            >
              <div style={{paddingTop: '8px', fontSize: '18px'}}>
                Report Type
              </div>
              <FormControl
                size='small'
                sx={{minWidth: '180px', maxWidth: '180px'}}>
                <Select
                  displayEmpty
                  value={reportType}
                  onChange={changeReportType}
                  renderValue={(selected: any) => {
                    if (selected.length === 0) {
                      return (
                        <div style={{color: 'grey'}}>
                          <em>Please Select</em>
                        </div>
                      );
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
            </Stack>
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
