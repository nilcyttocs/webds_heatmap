import React, { useState } from "react";

import Stack from "@mui/material/Stack";
import Select from "@mui/material/Select";
import Slider from "@mui/material/Slider";
import MenuItem from "@mui/material/MenuItem";
import Typography from "@mui/material/Typography";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";

import { Page, selectFile } from "./HeatmapComponent";

import ADCLive from "./adc_plots/ADCLive";
import RenderRate from "./live_controls/RenderRate";

import { Canvas } from "./mui_extensions/Canvas";
import { Content } from "./mui_extensions/Content";
import { Controls } from "./mui_extensions/Controls";

import {
  PauseRunToggle,
  RecordToggle,
  UploadButton
} from "./mui_extensions/Button";

import {
  ALERT_MESSAGE_LOAD_FILE,
  SAMPLES_MIN,
  SAMPLES_STEP,
  SAMPLES_MAX
} from "./constants";

const reportTypeList = ["Delta Image", "Raw Image", "Baseline Image"];

const statisticsList = ["Single", "Mean", "Max", "Min", "Range"];

const convertReportType = (reportType: string) => {
  switch (reportType) {
    case "Delta Image":
      return 18;
    case "Raw Image":
      return 19;
    case "Baseline Image":
      return 20;
    default:
      return undefined;
  }
};

export const Landing = (props: any): JSX.Element => {
  const [run, setRun] = useState<boolean>(true);
  const [record, setRecord] = useState<boolean>(false);
  const [reportType, setReportType] = useState<string>("Delta Image");
  const [statistics, setStatistics] = useState<string>("Single");
  const [samples, setSamples] = useState<number>(200);
  const [sampleRate, setSampleRate] = useState<number>(0);
  const [renderRate, setRenderRate] = useState<number>(0);

  const handlePlaybackButtonClick = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    try {
      const data = await selectFile(event);
      props.setADCData(data.data);
      props.setDataCounter((prev: number) => prev + 1);
      props.changePage(Page.Playback);
    } catch (error) {
      console.error(error);
      props.showAlert(ALERT_MESSAGE_LOAD_FILE);
      return;
    }
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

  return (
    <Canvas title={reportType === "" ? "ADC Data" : reportType}>
      <Content
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center"
        }}
      >
        {reportType !== "" ? (
          <ADCLive
            run={run}
            record={record}
            reportType={convertReportType(reportType)}
            statistics={statistics}
            samples={samples}
            updateSampleRate={setSampleRate}
            renderRate={renderRate}
          />
        ) : (
          <Typography>Please select report type</Typography>
        )}
      </Content>
      <Controls
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center"
        }}
      >
        <div
          style={{
            display: "flex",
            gap: "80px"
          }}
        >
          <div
            style={{
              display: "flex",
              gap: "16px"
            }}
          >
            <FormControl
              sx={{
                width: "150px",
                "& .MuiOutlinedInput-root": {
                  height: "40px"
                },
                "& .MuiSelect-icon": { width: "0.75em", height: "0.75em" }
              }}
            >
              <InputLabel sx={{ fontSize: "0.875rem" }}>Report Type</InputLabel>
              <Select
                displayEmpty
                value={reportType}
                label="Report Type"
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
                sx={{ fontSize: "0.875rem" }}
              >
                {reportTypeList.map((reportType) => (
                  <MenuItem
                    key={reportType}
                    value={reportType}
                    sx={{ fontSize: "0.875rem" }}
                  >
                    {reportType}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Stack spacing={3}>
              <FormControl
                disabled={!reportType}
                sx={{
                  width: "100px",
                  "& .MuiOutlinedInput-root": {
                    height: "40px"
                  },
                  "& .MuiSelect-icon": { width: "0.75em", height: "0.75em" }
                }}
              >
                <InputLabel sx={{ fontSize: "0.875rem" }}>
                  Statistics
                </InputLabel>
                <Select
                  value={statistics}
                  label="Statistics"
                  onChange={changeStatistics}
                  sx={{ fontSize: "0.875rem" }}
                >
                  {statisticsList.map((statistics) => (
                    <MenuItem
                      key={statistics}
                      value={statistics}
                      sx={{ fontSize: "0.875rem" }}
                    >
                      {statistics}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              {statistics === "Single" ? null : (
                <div>
                  <Typography variant="body2">Samples: {samples}</Typography>
                  <Slider
                    value={samples}
                    min={SAMPLES_MIN}
                    step={SAMPLES_STEP}
                    max={SAMPLES_MAX}
                    valueLabelDisplay="auto"
                    onChange={changeSamples}
                    sx={{ marginTop: "8px" }}
                  />
                  <Typography variant="body2" sx={{ marginTop: "8px" }}>
                    Sample Rate: {sampleRate}
                  </Typography>
                </div>
              )}
            </Stack>
            <RenderRate setRenderRate={setRenderRate} />
          </div>
          <div style={{ display: "flex", gap: "16px" }}>
            <PauseRunToggle
              running={run}
              disabled={!reportType}
              onClick={() => {
                setRun(!run);
              }}
            />
            <RecordToggle
              recording={record}
              disabled={!reportType}
              onClick={() => {
                setRecord((prev) => !prev);
              }}
            />
            <UploadButton
              tooltip="Playback"
              disabled={record}
              input={
                <input
                  hidden
                  type="file"
                  accept=".json"
                  onChange={handlePlaybackButtonClick}
                />
              }
            />
          </div>
        </div>
      </Controls>
    </Canvas>
  );
};

export default Landing;
