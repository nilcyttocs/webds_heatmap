import React, { useState, useEffect } from "react";

import Typography from "@mui/material/Typography";

import Plot from "react-plotly.js";

import { requestAPI } from "./handler";

const SSE_CLOSED = 2;

const REPORT_TOUCH = 17;
const REPORT_DELTA = 18;
const REPORT_RAW = 19;
const REPORT_BASELINE = 20;

const HEAT_PLOT_HEIGHT = 300;
const BARX_PLOT_HEIGHT = 60;
const BARY_PLOT_HEIGHT = HEAT_PLOT_HEIGHT;
const BARY_PLOT_WIDTH = BARX_PLOT_HEIGHT;

const REPORT_FPS = 120;

const RENDER_FPS = 30;
const RENDER_INTERVAL = 1000 / RENDER_FPS;

let run = false;
let reportType = "";
let fontColor = "";

let eventSource: EventSource | undefined = undefined;
let eventData: any = undefined;
let eventError = false;

let statistics: string;
let samples: number;
let index: number;
let filled: boolean;

type Report = {
  image: number[][];
  hybridx: number[];
  hybridy: number[];
};

const bufferSize = 1000;
let buffer: Report[];
let subBuffer: Report[] | undefined;

let t00: number;
let t11: number;
let fps: number;
let eventCount: number;

const updateSubBuffer = () => {
  const end = index;
  const start = index - samples;
  if (start < 0) {
    subBuffer = [...buffer.slice(start), ...buffer.slice(0, end)];
  } else {
    subBuffer = buffer.slice(start, end);
  }
};

const eventHandler = (event: any) => {
  const data = JSON.parse(event.data);
  if (!data || !data.report) {
    return;
  }
  if (
    (reportType === "Delta Image" && data.report[0] === "delta") ||
    (reportType === "Raw Image" && data.report[0] === "raw") ||
    (reportType === "Baseline Image" && data.report[0] === "baseline")
  ) {
    eventData = data.report[1];
  } else {
    return;
  }

  if (eventData.image === undefined || buffer === undefined) {
    return;
  }

  eventCount++;
  t11 = Date.now();
  if (t11 - t00 >= 1000) {
    t00 = t11;
    fps = eventCount;
    eventCount = 0;
  }

  index = (index + 1) % bufferSize;
  buffer[index] = {
    image: eventData.image,
    hybridx: eventData.hybridx,
    hybridy: eventData.hybridy
  };

  if (!filled) {
    if (index + 1 >= samples) {
      updateSubBuffer();
    } else {
      subBuffer = undefined;
    }
    if (index + 1 === bufferSize) {
      filled = true;
    }
  } else {
    updateSubBuffer();
  }
};

const removeEvent = () => {
  if (eventSource && eventSource.readyState !== SSE_CLOSED) {
    eventSource.removeEventListener("report", eventHandler, false);
    eventSource.close();
    eventSource = undefined;
  }
};

const errorHandler = (error: any) => {
  eventError = true;
  removeEvent();
  console.error(`Error on GET /webds/report\n${error}`);
};

const addEvent = () => {
  if (eventSource) {
    return;
  }
  eventError = false;
  eventSource = new window.EventSource("/webds/report");
  eventSource.addEventListener("report", eventHandler, false);
  eventSource.addEventListener("error", errorHandler, false);
};

const setReport = async (
  disable: number[],
  enable: number[]
): Promise<void> => {
  const dataToSend = { enable, disable, fps: REPORT_FPS };
  try {
    await requestAPI<any>("report", {
      body: JSON.stringify(dataToSend),
      method: "POST"
    });
    addEvent();
  } catch (error) {
    console.error("Error - POST /webds/report");
    return Promise.reject("Failed to enable/disable report types");
  }
  return Promise.resolve();
};

const HeatmapPlot = (props: any): JSX.Element => {
  const [showPlot, setShowPlot] = useState<boolean>(false);
  const [showMessage, setShowMessage] = useState<boolean>(false);

  const [heatData, setHeatData] = useState<any>([]);
  const [heatConfig, setHeatConfig] = useState<any>({});
  const [heatLayout, setHeatLayout] = useState<any>({});
  const [heatFrames, setHeatFrames] = useState<any>([]);

  const [barXData, setBarXData] = useState<any>([]);
  const [barXConfig, setBarXConfig] = useState<any>({});
  const [barXLayout, setBarXLayout] = useState<any>({});
  const [barXFrames, setBarXFrames] = useState<any>([]);

  const [barYData, setBarYData] = useState<any>([]);
  const [barYConfig, setBarYConfig] = useState<any>({});
  const [barYLayout, setBarYLayout] = useState<any>({});
  const [barYFrames, setBarYFrames] = useState<any>([]);

  const barYLMargin = 40;
  const barYRMargin = 40;
  const barYTMargin = 20;
  const barYBMargin = 30;
  const barYHeight = BARY_PLOT_HEIGHT + barYTMargin + barYBMargin;
  const barYWidth = BARY_PLOT_WIDTH + barYLMargin + barYRMargin;

  const heatLMargin = 0;
  const heatRMargin = 110;
  const heatTMargin = barYTMargin;
  const heatBMargin = barYBMargin;
  const heatHeight = HEAT_PLOT_HEIGHT + heatTMargin + heatBMargin;
  const heatWidth =
    Math.floor((HEAT_PLOT_HEIGHT * props.numCols) / props.numRows) +
    heatLMargin +
    heatRMargin;

  const barXLMargin = barYWidth + heatLMargin;
  const barXRMargin = 110;
  const barXTMargin = 10;
  const barXBMargin = 10;
  const barXHeight = BARX_PLOT_HEIGHT + barXTMargin + barXBMargin;
  const barXWidth =
    Math.floor((HEAT_PLOT_HEIGHT * props.numCols) / props.numRows) +
    barXLMargin +
    barXRMargin;

  const plotWidth = barYWidth + heatWidth;
  const plotHeight = heatHeight + barXHeight;

  const plotConfig = { displayModeBar: false };

  const plot_bgcolor = "rgba(0.75, 0.75, 0.75, 0.1)";
  const paper_bgcolor = "rgba(0, 0, 0, 0)";
  const axis_linecolor = "rgba(128, 128, 128, 0.5)";

  let heatZ: number[][] | undefined;
  let heatZMin: number;
  let heatZMax: number;

  let barX: number[] | undefined;
  let barXMin: number | undefined;
  let barXMax: number | undefined;

  let barY: number[] | undefined;
  let barYMin: number | undefined;
  let barYMax: number | undefined;

  let t0: number;
  let t1: number;
  let tThen: number;
  let frameCount: number;
  let requestID: number | undefined;

  const storeHeatState = (figure: any) => {
    setHeatData(figure.data);
    setHeatConfig(figure.config);
    setHeatLayout(figure.layout);
    setHeatFrames(figure.frames);
  };

  const storeBarXState = (figure: any) => {
    setBarXData(figure.data);
    setBarXConfig(figure.config);
    setBarXLayout(figure.layout);
    setBarXFrames(figure.frames);
  };

  const storeBarYState = (figure: any) => {
    setBarYData(figure.data);
    setBarYConfig(figure.config);
    setBarYLayout(figure.layout);
    setBarYFrames(figure.frames);
  };

  const stopAnimation = () => {
    if (requestID) {
      cancelAnimationFrame(requestID);
      requestID = undefined;
    }
  };

  const getMean = () => {
    if (subBuffer === undefined) {
      return undefined;
    }
    try {
      const mean = subBuffer.reduce(
        function (mean, cur) {
          for (let i = 0; i < props.numRows; i++) {
            for (let j = 0; j < props.numCols; j++) {
              mean.image[i][j] += cur.image[i][j] / samples;
            }
          }
          for (let i = 0; i < props.numCols; i++) {
            mean.hybridx[i] += cur.hybridx[i] / samples;
          }
          for (let i = 0; i < props.numRows; i++) {
            mean.hybridy[i] += cur.hybridy[i] / samples;
          }
          return mean;
        },
        {
          image: [...Array(props.numRows)].map((e) =>
            Array(props.numCols).fill(0)
          ),
          hybridx: [...Array(props.numCols)].map((e) => 0),
          hybridy: [...Array(props.numRows)].map((e) => 0)
        }
      );
      return mean;
    } catch {
      return undefined;
    }
  };

  const getMax = () => {
    if (subBuffer === undefined) {
      return undefined;
    }
    try {
      const max = subBuffer.reduce(
        function (max, cur) {
          for (let i = 0; i < props.numRows; i++) {
            for (let j = 0; j < props.numCols; j++) {
              max.image[i][j] =
                cur.image[i][j] > max.image[i][j]
                  ? cur.image[i][j]
                  : max.image[i][j];
            }
          }
          for (let i = 0; i < props.numCols; i++) {
            max.hybridx[i] =
              cur.hybridx[i] > max.hybridx[i] ? cur.hybridx[i] : max.hybridx[i];
          }
          for (let i = 0; i < props.numRows; i++) {
            max.hybridy[i] =
              cur.hybridy[i] > max.hybridy[i] ? cur.hybridy[i] : max.hybridy[i];
          }
          return max;
        },
        {
          image: [...Array(props.numRows)].map((e) =>
            Array(props.numCols).fill(-Infinity)
          ),
          hybridx: [...Array(props.numCols)].map((e) => -Infinity),
          hybridy: [...Array(props.numRows)].map((e) => -Infinity)
        }
      );
      return max;
    } catch {
      return undefined;
    }
  };

  const getMin = () => {
    if (subBuffer === undefined) {
      return undefined;
    }
    try {
      const min = subBuffer.reduce(
        function (min, cur) {
          for (let i = 0; i < props.numRows; i++) {
            for (let j = 0; j < props.numCols; j++) {
              min.image[i][j] =
                cur.image[i][j] < min.image[i][j]
                  ? cur.image[i][j]
                  : min.image[i][j];
            }
          }
          for (let i = 0; i < props.numCols; i++) {
            min.hybridx[i] =
              cur.hybridx[i] < min.hybridx[i] ? cur.hybridx[i] : min.hybridx[i];
          }
          for (let i = 0; i < props.numRows; i++) {
            min.hybridy[i] =
              cur.hybridy[i] < min.hybridy[i] ? cur.hybridy[i] : min.hybridy[i];
          }
          return min;
        },
        {
          image: [...Array(props.numRows)].map((e) =>
            Array(props.numCols).fill(Infinity)
          ),
          hybridx: [...Array(props.numCols)].map((e) => Infinity),
          hybridy: [...Array(props.numRows)].map((e) => Infinity)
        }
      );
      return min;
    } catch {
      return undefined;
    }
  };

  const getRange = () => {
    if (subBuffer === undefined) {
      return undefined;
    }
    try {
      const max = getMax();
      const min = getMin();
      if (max === undefined || min === undefined) {
        return undefined;
      }
      const range = {
        image: [...Array(props.numRows)].map((e) => Array(props.numCols)),
        hybridx: [...Array(props.numCols)],
        hybridy: [...Array(props.numRows)]
      };
      range.image = max.image.map(function (rArray, rIndex) {
        return rArray.map(function (maxElement, cIndex) {
          return maxElement - min.image[rIndex][cIndex];
        });
      });
      range.hybridx = max.hybridx.map(function (maxElement, index) {
        return maxElement - min.hybridx[index];
      });
      range.hybridy = max.hybridy.map(function (maxElement, index) {
        return maxElement - min.hybridy[index];
      });
      return range;
    } catch {
      return undefined;
    }
  };

  const computePlot = () => {
    if (eventData === undefined) {
      heatZ = undefined;
      barX = undefined;
      barY = undefined;
      return;
    }

    let result: Report | undefined;
    switch (statistics) {
      case "Single":
        result = buffer[index];
        break;
      case "Mean":
        result = getMean();
        break;
      case "Max":
        result = getMax();
        break;
      case "Min":
        result = getMin();
        break;
      case "Range":
        result = getRange();
        break;
      default:
        result = undefined;
        break;
    }
    if (result === undefined) {
      heatZ = undefined;
      barX = undefined;
      barY = undefined;
      return;
    } else {
      heatZ = result.image;
      barX = result.hybridx;
      barY = result.hybridy;
    }

    const minRow = heatZ!.map((row: number[]) => {
      return Math.min.apply(Math, row);
    });
    heatZMin = Math.min.apply(Math, minRow);
    const maxRow = heatZ!.map((row: number[]) => {
      return Math.max.apply(Math, row);
    });
    heatZMax = Math.max.apply(Math, maxRow);

    const minBarX = Math.min.apply(Math, barX);
    const maxBarX = Math.max.apply(Math, barX);
    if (barXMin === undefined) {
      barXMin = minBarX;
    } else {
      barXMin = minBarX < barXMin ? minBarX : barXMin;
    }
    if (barXMax === undefined) {
      barXMax = maxBarX;
    } else {
      barXMax = maxBarX > barXMax ? maxBarX : barXMax;
    }

    const minBarY = Math.min.apply(Math, barY);
    const maxBarY = Math.max.apply(Math, barY);
    if (barYMin === undefined) {
      barYMin = minBarY;
    } else {
      barYMin = minBarY < barYMin ? minBarY : barYMin;
    }
    if (barYMax === undefined) {
      barYMax = maxBarY;
    } else {
      barYMax = maxBarY > barYMax ? maxBarY : barYMax;
    }
  };

  const animatePlot = () => {
    if (eventError) {
      props.resetReportType();
      return;
    }

    requestID = requestAnimationFrame(animatePlot);

    if (!run) {
      return;
    }

    const tNow = window.performance.now();
    const elapsed = tNow - tThen;

    if (elapsed <= RENDER_INTERVAL) {
      return;
    }

    tThen = tNow - (elapsed % RENDER_INTERVAL);

    computePlot();

    if (heatZ === undefined || barX === undefined || barY === undefined) {
      return;
    }

    setHeatLayout({
      width: heatWidth,
      height: heatHeight,
      margin: {
        l: heatLMargin,
        r: heatRMargin,
        t: heatTMargin,
        b: heatBMargin
      },
      font: {
        color: fontColor
      },
      paper_bgcolor,
      xaxis: {
        ticks: "",
        showticklabels: false
      },
      yaxis: {
        ticks: "",
        showticklabels: false
      }
    });

    setHeatData([
      {
        z: heatZ,
        zmin: heatZMin,
        zmax: heatZMax,
        type: "heatmap",
        showscale: true,
        colorscale: "Viridis",
        colorbar: {
          tickformat: "<-d",
          tickmode: "array",
          tickvals: [heatZMin, heatZMax]
        }
      }
    ]);

    setBarXLayout({
      width: barXWidth,
      height: barXHeight,
      margin: {
        l: barXLMargin,
        r: barXRMargin,
        t: barXTMargin,
        b: barXBMargin
      },
      font: {
        color: fontColor
      },
      plot_bgcolor,
      paper_bgcolor,
      xaxis: {
        mirror: true,
        showline: true,
        showgrid: false,
        ticks: "",
        tickformat: ">-d",
        tickmode: "array",
        tickvals: [],
        linecolor: axis_linecolor
      },
      yaxis: {
        mirror: true,
        showline: true,
        showgrid: false,
        ticks: "",
        tickformat: ">-d",
        tickmode: "array",
        tickvals: [barXMin, barXMax],
        range: [barXMin, barXMax],
        linecolor: axis_linecolor,
        zerolinecolor: axis_linecolor
      }
    });

    setBarXData([
      {
        y: barX,
        type: "bar",
        width: 0.5
      }
    ]);

    setBarYLayout({
      width: barYWidth,
      height: barYHeight,
      margin: {
        l: barYLMargin,
        r: barYRMargin,
        t: barYTMargin,
        b: barYBMargin
      },
      font: {
        color: fontColor
      },
      plot_bgcolor,
      paper_bgcolor,
      xaxis: {
        side: "top",
        mirror: true,
        showline: true,
        showgrid: false,
        ticks: "",
        tickformat: ">-d",
        tickmode: "array",
        tickvals: [barYMin, barYMax],
        range: [barYMin, barYMax],
        linecolor: axis_linecolor,
        zerolinecolor: axis_linecolor
      },
      yaxis: {
        mirror: true,
        showline: true,
        showgrid: false,
        ticks: "",
        tickformat: ">-d",
        tickmode: "array",
        tickvals: [],
        linecolor: axis_linecolor
      }
    });

    setBarYData([
      {
        x: barY,
        type: "bar",
        width: 0.5
      }
    ]);

    frameCount++;
    t1 = Date.now();
    if (t1 - t0 >= 1000) {
      t0 = t1;
      console.log(`ADC FPS = ${frameCount}`);
      frameCount = 0;
      props.updateSampleRate(fps);
    }

    setShowPlot(true);
  };

  const startAnimation = () => {
    t0 = Date.now();
    t00 = Date.now();
    frameCount = 0;
    barXMin = undefined;
    barXMax = undefined;
    barYMin = undefined;
    barYMax = undefined;
    eventCount = 0;
    eventData = undefined;
    index = bufferSize - 1;
    filled = false;
    buffer = new Array(bufferSize);
    subBuffer = undefined;
    tThen = window.performance.now();
    animatePlot();
  };

  const newPlot = async () => {
    reportType = props.reportType;
    if (!reportType) {
      setShowMessage(true);
      setShowPlot(false);
      return;
    }
    setShowMessage(false);
    setHeatConfig(plotConfig);
    setBarXConfig(plotConfig);
    setBarYConfig(plotConfig);
    try {
      if (reportType === "Delta Image") {
        await setReport(
          [REPORT_TOUCH, REPORT_RAW, REPORT_BASELINE],
          [REPORT_DELTA]
        );
      } else if (reportType === "Raw Image") {
        await setReport(
          [REPORT_TOUCH, REPORT_DELTA, REPORT_BASELINE],
          [REPORT_RAW]
        );
      } else if (reportType === "Baseline Image") {
        await setReport(
          [REPORT_TOUCH, REPORT_DELTA, REPORT_RAW],
          [REPORT_BASELINE]
        );
      }
    } catch (error) {
      console.error(error);
      props.resetReportType();
      return;
    }
    startAnimation();
  };

  useEffect(() => {
    return () => {
      removeEvent();
    };
  }, []);

  useEffect(() => {
    fontColor = props.fontColor;
  }, [props.fontColor]);

  useEffect(() => {
    newPlot();
    return () => {
      stopAnimation();
    };
  }, [props.reportType]);

  useEffect(() => {
    statistics = props.statistics;
  }, [props.statistics]);

  useEffect(() => {
    samples = props.samples;
  }, [props.samples]);

  useEffect(() => {
    run = props.run;
  }, [props.run]);

  useEffect(() => {
    props.updatePlotWidth(plotWidth);
  }, []);

  return (
    <div
      style={{
        width: plotWidth + "px",
        height: 30 + plotHeight + "px",
        display: "flex",
        alignItems: "center"
      }}
    >
      {showPlot ? (
        <div>
          <Typography
            variant="h5"
            sx={{
              width: "100%",
              height: "30px",
              textAlign: "center"
            }}
          >
            {reportType}
          </Typography>
          <div style={{ display: "flex", flexWrap: "nowrap" }}>
            <Plot
              data={barYData}
              config={barYConfig}
              layout={barYLayout}
              frames={barYFrames}
              onInitialized={(figure) => storeBarYState(figure)}
              onUpdate={(figure) => storeBarYState(figure)}
            />
            <Plot
              data={heatData}
              config={heatConfig}
              layout={heatLayout}
              frames={heatFrames}
              onInitialized={(figure) => storeHeatState(figure)}
              onUpdate={(figure) => storeHeatState(figure)}
            />
          </div>
          <Plot
            data={barXData}
            config={barXConfig}
            layout={barXLayout}
            frames={barXFrames}
            onInitialized={(figure) => storeBarXState(figure)}
            onUpdate={(figure) => storeBarXState(figure)}
          />
        </div>
      ) : showMessage ? (
        <Typography sx={{ width: "100%", textAlign: "center" }}>
          Please select report type
        </Typography>
      ) : null}
    </div>
  );
};

export default HeatmapPlot;
