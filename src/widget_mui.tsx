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

const reportTypeList = [
  'Delta Image',
  'Raw Image',
  'Baseline Image'
];

const statisticsList = [
  'Single',
  'Mean',
  'Max',
  'Min'
];

const samplesList = [
  10,
  100,
  500,
  1000
];

export const HeatmapMui = (props: any): JSX.Element => {
  const [run, setRun] = useState<boolean>(false);
  const [reportType, setReportType] = useState<string>('');
  const [statistics, setStatistics] = useState<string>('Single');
  const [samples, setSamples] = useState<number>(10);

  const resetReportType = () => {
    setReportType('');
    setStatistics('Single');
    setRun(false);
  };

  const changeReportType = (event: any) => {
    if (reportType !== event.target.value) {
      setReportType(event.target.value);
      setStatistics('Single');
      if (event.target.value) {
        setRun(true);
      }
    }
  };

  const changeStatistics = (event: any) => {
    if (statistics !== event.target.value) {
      setStatistics(event.target.value);
    }
  };

  const changeSamples = (event: any) => {
    if (samples !== event.target.value) {
      setSamples(event.target.value);
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
            statistics={statistics}
            samples={samples}
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
                  {reportTypeList.map((reportType) => (
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
            <Stack
              spacing={5}
            >
              <Stack
                spacing={1}
                direction='row'
              >
                <div style={{minWidth: '70px', maxWidth: '70px', paddingTop: '8px', textAlign: 'right', fontSize: '18px'}}>
                  Statistics
                </div>
                <FormControl
                  size='small'
                  disabled={!reportType}
                  sx={{minWidth: '180px', maxWidth: '180px'}}>
                  <Select
                    value={statistics}
                    onChange={changeStatistics}
                  >
                    {statisticsList.map((statistics) => (
                      <MenuItem
                        key={statistics}
                        value={statistics}
                      >
                        {statistics}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Stack>
              {statistics === 'Single' ? (
                null
              ) : (
                <Stack
                  spacing={1}
                  direction='row'
                >
                  <div style={{minWidth: '70px', maxWidth: '70px', paddingTop: '8px', textAlign: 'right', fontSize: '18px'}}>
                    Samples
                  </div>
                  <FormControl
                    size='small'
                    sx={{minWidth: '180px', maxWidth: '180px'}}>
                    <Select
                      value={samples}
                      onChange={changeSamples}
                    >
                      {samplesList.map((samples) => (
                        <MenuItem
                          key={samples}
                          value={samples}
                        >
                          {samples}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Stack>
              )}
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
