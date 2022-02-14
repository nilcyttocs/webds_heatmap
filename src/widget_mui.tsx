import React, { useState } from 'react';

import Fab from '@mui/material/Fab';
import Stack from '@mui/material/Stack';
import Select from '@mui/material/Select';
import Slider from '@mui/material/Slider';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import { ThemeProvider } from '@mui/material/styles';

import StopIcon from '@mui/icons-material/Stop';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';

import HeatmapPlot from './heatmap_component';

import webdsTheme from './webdsTheme';

const dividerWidth = 95 + 8 + 180 + 56 + 69 + 8 + 180 + 56 + 40;

const reportTypeList = [
  'Delta Image',
  'Raw Image',
  'Baseline Image'
];

const statisticsList = [
  'Single',
  'Mean',
  'Max',
  'Min',
  'Range'
];

const samplesMin = 100;
const samplesStep = 100;
const samplesMax = 1000;

export const HeatmapMui = (props: any): JSX.Element => {
  const [run, setRun] = useState<boolean>(false);
  const [reportType, setReportType] = useState<string>('');
  const [statistics, setStatistics] = useState<string>('Single');
  const [samples, setSamples] = useState<number>(200);
  const [sampleRate, setSampleRate] = useState<number>(0);

  const resetReportType = () => {
    setReportType('');
    setStatistics('Single');
    setSamples(200);
    setRun(false);
  };

  const changeReportType = (event: any) => {
    if (reportType !== event.target.value) {
      setReportType(event.target.value);
      setStatistics('Single');
      setSamples(200);
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

  const updateSampleRate = (rate: number) => {
    setSampleRate(rate);
  };

  return (
    <ThemeProvider theme={webdsTheme}>
      <div>
        <Stack
          spacing={5}
          divider={<Divider orientation='horizontal' sx={{width: dividerWidth + 'px'}}/>}
          sx={{marginLeft: '50px', marginTop: '50px'}}
        >
          <HeatmapPlot
            run={run}
            numCols={props.numCols}
            numRows={props.numRows}
            reportType={reportType}
            statistics={statistics}
            samples={samples}
            resetReportType={resetReportType}
            updateSampleRate={updateSampleRate}/>
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
                <div style={{paddingTop: '8px', fontSize: '18px'}}>
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
                <div>
                  <div style={{marginBottom: '5px', fontSize: '18px'}}>
                    Samples: {samples}
                  </div>
                  <Slider
                    value={samples}
                    min={samplesMin}
                    step={samplesStep}
                    max={samplesMax}
                    valueLabelDisplay='auto'
                    onChange={changeSamples}
                  />
                  <div style={{marginTop: '10px', fontSize: '18px'}}>
                    Sample Rate: {sampleRate}
                  </div>
                </div>
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
