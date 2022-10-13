import React, { useEffect, useState } from "react";

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
import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";

import { styled } from "@mui/material/styles";

import { keyframes } from "@mui/system";

import { Page, selectFile } from "./HeatmapComponent";

import LivePlot from "./LivePlot";

const reportTypeList = ["Delta Image", "Raw Image", "Baseline Image"];

const statisticsList = ["Single", "Mean", "Max", "Min", "Range"];

const SAMPLES_MIN = 100;
const SAMPLES_STEP = 100;
const SAMPLES_MAX = 1000;

const SELECT_WIDTH = 200;

const showHelp = false;

const Input = styled("input")({
  display: "none"
});

const blink = keyframes`
  33% { color: red; }
  66% { color: black; }
  100% { color: red; }
`;

export const Landing = (props: any): JSX.Element => {
  const [run, setRun] = useState<boolean>(true);
  const [record, setRecord] = useState<boolean>(false);
  const [reportType, setReportType] = useState<string>("Delta Image");
  const [statistics, setStatistics] = useState<string>("Single");
  const [samples, setSamples] = useState<number>(200);
  const [sampleRate, setSampleRate] = useState<number>(0);
  const [statisticsWidth, setStatisticsWidth] = useState<number>(0);
  const [statisticsLeftMargin, setStatisticsLeftMargin] = useState<number>(0);

  const handleRecordButtonClick = () => {
    setRecord((prev) => !prev);
  };

  const handlePlayButtonClick = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    try {
      const data = await selectFile(event);
      props.setRecordedData(data);
      props.changePage(Page.Playback);
    } catch {
      return;
    }
  };

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

  useEffect(() => {
    const leftMargin =
      document.getElementById("webds_heatmap_report_type_text")!.clientWidth -
      document.getElementById("webds_heatmap_statistics_text")!.clientWidth;
    setStatisticsLeftMargin(leftMargin);
    setStatisticsWidth(
      document.getElementById("webds_heatmap_report_type")!.clientWidth -
        leftMargin
    );
  }, []);

  return (
    <>
      <Stack spacing={2}>
        <Box
          sx={{
            width: props.dimensions.width + "px",
            height: props.dimensions.heightTitle + "px",
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
            {reportType === "" ? "ADC Data" : reportType}
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
            width: props.dimensions.width + "px",
            minHeight: props.dimensions.heightContent + "px",
            boxSizing: "border-box",
            padding: "24px",
            position: "relative",
            bgcolor: "section.main",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center"
          }}
        >
          <LivePlot
            run={run}
            record={record}
            numCols={props.numCols}
            numRows={props.numRows}
            fontColor={props.fontColor}
            reportType={reportType}
            statistics={statistics}
            samples={samples}
            resetReportType={resetReportType}
            updateSampleRate={updateSampleRate}
          />
        </Box>
        <Box
          sx={{
            width: props.dimensions.width + "px",
            minHeight: props.dimensions.heightControls + "px",
            boxSizing: "border-box",
            padding: "24px",
            position: "relative",
            bgcolor: "section.main"
          }}
        >
          <Stack spacing={3}>
            <div
              style={{
                width: "100%",
                display: "flex",
                justifyContent: "space-between"
              }}
            >
              <Stack id="webds_heatmap_report_type" spacing={1} direction="row">
                <Typography
                  id="webds_heatmap_report_type_text"
                  sx={{ paddingTop: "10px" }}
                >
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
              <Stack spacing={2} direction="row">
                <Button
                  disabled={!reportType}
                  endIcon={
                    <FiberManualRecordIcon
                      sx={{
                        color: record ? "red" : null,
                        animation: record ? `${blink} 1s linear infinite` : null
                      }}
                    />
                  }
                  onClick={handleRecordButtonClick}
                  sx={{ width: "120px" }}
                >
                  REC
                </Button>
                <label
                  htmlFor="webds_heatmap_playback_file_input"
                  style={{ display: "flex" }}
                >
                  <Input
                    id="webds_heatmap_playback_file_input"
                    type="file"
                    accept=".json"
                    disabled={record}
                    onChange={handlePlayButtonClick}
                  />
                  <Button
                    component="span"
                    disabled={record}
                    endIcon={<PlayArrowIcon />}
                    sx={{ width: "120px" }}
                  >
                    PLAY
                  </Button>
                </label>
              </Stack>
            </div>
            <Stack spacing={5}>
              <Stack spacing={1} direction="row">
                <Typography
                  id="webds_heatmap_statistics_text"
                  sx={{
                    marginLeft: statisticsLeftMargin + "px",
                    paddingTop: "10px"
                  }}
                >
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
                <div
                  style={{
                    width: statisticsWidth + "px",
                    marginLeft: statisticsLeftMargin + "px"
                  }}
                >
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
          </Stack>
        </Box>
      </Stack>
    </>
  );
};

export default Landing;
