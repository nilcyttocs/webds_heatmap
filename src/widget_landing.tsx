import React, { useState } from "react";

import Box from "@mui/material/Box";
import Fab from "@mui/material/Fab";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import Select from "@mui/material/Select";
import Slider from "@mui/material/Slider";
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

const WIDTH = 800;
const HEIGHT_TITLE = 70;
const HEIGHT_CONTENT = 450;
const HEIGHT_CONTROLS = 120;

const SELECT_WIDTH = 200;

const showHelp = false;

export const Landing = (props: any): JSX.Element => {
  const [run, setRun] = useState<boolean>(true);
  const [reportType, setReportType] = useState<string>("Delta Image");
  const [statistics, setStatistics] = useState<string>("Single");
  const [samples, setSamples] = useState<number>(200);
  const [sampleRate, setSampleRate] = useState<number>(0);

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

  return (
    <>
      <Stack spacing={2}>
        <Box
          sx={{
            width: WIDTH + "px",
            height: HEIGHT_TITLE + "px",
            position: "relative",
            bgcolor: "section.main"
          }}
        >
          <Typography
            variant="h5"
            sx={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)"
            }}
          >
            {reportType}
          </Typography>
          {showHelp && (
            <Button
              variant="text"
              sx={{
                position: "absolute",
                top: "50%",
                left: "16px",
                transform: "translate(0%, -50%)"
              }}
            >
              <Typography variant="body2" sx={{ textDecoration: "underline" }}>
                Help
              </Typography>
            </Button>
          )}
        </Box>
        <Box
          sx={{
            width: WIDTH + "px",
            minHeight: HEIGHT_CONTENT + "px",
            position: "relative",
            bgcolor: "section.main",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center"
          }}
        >
          <div
            style={{
              margin: "24px"
            }}
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
            />
          </div>
        </Box>
        <Box
          sx={{
            width: WIDTH + "px",
            minHeight: HEIGHT_CONTROLS + "px",
            position: "relative",
            bgcolor: "section.main",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center"
          }}
        >
          <div
            style={{
              margin: "24px"
            }}
          >
            <div
              style={{
                width: WIDTH * 0.9 + "px",
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
                    width: SELECT_WIDTH + "px"
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
                      width: SELECT_WIDTH + "px"
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
          </div>
        </Box>
      </Stack>
    </>
  );
};
