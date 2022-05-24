import React, { useState } from "react";

import Fab from "@mui/material/Fab";
import Stack from "@mui/material/Stack";
import Select from "@mui/material/Select";
import Slider from "@mui/material/Slider";
import Divider from "@mui/material/Divider";
import MenuItem from "@mui/material/MenuItem";
import Typography from "@mui/material/Typography";
import FormControl from "@mui/material/FormControl";

import StopIcon from "@mui/icons-material/Stop";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";

import HeatmapPlot from "./heatmap_component";

const reportTypeList = ["Delta Image", "Raw Image", "Baseline Image"];

const statisticsList = ["Single", "Mean", "Max", "Min", "Range"];

const SAMPLES_MIN = 100;
const SAMPLES_STEP = 100;
const SAMPLES_MAX = 1000;

const SELECT_WIDTH = 200;

export const HeatmapMui = (props: any): JSX.Element => {
  const [run, setRun] = useState<boolean>(true);
  const [reportType, setReportType] = useState<string>("Delta Image");
  const [statistics, setStatistics] = useState<string>("Single");
  const [samples, setSamples] = useState<number>(200);
  const [sampleRate, setSampleRate] = useState<number>(0);
  const [plotWidth, setPlotWidth] = useState<number>(0);

  const resetReportType = () => {
    setReportType("");
    setStatistics("Single");
    setSamples(200);
    setRun(false);
  };

  const changeReportType = (event: any) => {
    if (reportType !== event.target.value) {
      setReportType(event.target.value);
      setStatistics("Single");
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

  const updatePlotWidth = (width: number) => {
    setPlotWidth(width);
  };

  return (
    <>
      <div>
        <Stack
          spacing={5}
          divider={
            <Divider
              orientation="horizontal"
              sx={{ width: plotWidth + "px" }}
            />
          }
        >
          <HeatmapPlot
            run={run}
            numCols={props.numCols}
            numRows={props.numRows}
            fontColor={props.fontColor}
            reportType={reportType}
            statistics={statistics}
            samples={samples}
            resetReportType={resetReportType}
            updateSampleRate={updateSampleRate}
            updatePlotWidth={updatePlotWidth}
          />

          <div
            style={{
              width: plotWidth + "px",
              display: "flex",
              justifyContent: "space-between"
            }}
          >
            <Stack spacing={1} direction="row">
              <Typography id="reportTypeText" sx={{ paddingTop: "10px" }}>
                Report Type
              </Typography>
              <FormControl
                size="small"
                sx={{
                  minWidth: SELECT_WIDTH + "px",
                  maxWidth: SELECT_WIDTH + "px"
                }}
              >
                <Select
                  displayEmpty
                  value={reportType}
                  onChange={changeReportType}
                  renderValue={(selected: any) => {
                    if (selected.length === 0) {
                      return (
                        <div style={{ color: "grey" }}>
                          <em>Please Select</em>
                        </div>
                      );
                    }
                    return selected;
                  }}
                >
                  {reportTypeList.map((reportType) => (
                    <MenuItem key={reportType} value={reportType}>
                      {reportType}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>
            <Stack spacing={5}>
              <Stack spacing={1} direction="row">
                <Typography id="statisticsText" sx={{ paddingTop: "10px" }}>
                  Statistics
                </Typography>
                <FormControl
                  size="small"
                  disabled={!reportType}
                  sx={{
                    minWidth: SELECT_WIDTH + "px",
                    maxWidth: SELECT_WIDTH + "px"
                  }}
                >
                  <Select value={statistics} onChange={changeStatistics}>
                    {statisticsList.map((statistics) => (
                      <MenuItem key={statistics} value={statistics}>
                        {statistics}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Stack>
              {statistics === "Single" ? null : (
                <div>
                  <Typography sx={{ marginBottom: "5px" }}>
                    Samples: {samples}
                  </Typography>
                  <Slider
                    value={samples}
                    min={SAMPLES_MIN}
                    step={SAMPLES_STEP}
                    max={SAMPLES_MAX}
                    valueLabelDisplay="auto"
                    onChange={changeSamples}
                  />
                  <Typography sx={{ marginTop: "10px" }}>
                    Sample Rate: {sampleRate}
                  </Typography>
                </div>
              )}
            </Stack>
            {run === false ? (
              <Fab
                disabled={!reportType}
                onClick={() => {
                  setRun(true);
                }}
              >
                <PlayArrowIcon />
              </Fab>
            ) : (
              <Fab
                disabled={!reportType}
                onClick={() => {
                  setRun(false);
                }}
              >
                <StopIcon />
              </Fab>
            )}
          </div>
        </Stack>
      </div>
    </>
  );
};
