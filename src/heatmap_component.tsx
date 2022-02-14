import React, { useState, useEffect } from 'react';

import Plot from 'react-plotly.js';

import { requestAPI } from './handler';

const SSE_CLOSED = 2

const REPORT_TOUCH = 17;
const REPORT_DELTA = 18;
const REPORT_RAW = 19;
const REPORT_BASELINE = 20;

const HEAT_PLOT_HEIGHT = 350;
const BARX_PLOT_HEIGHT = 70;
const BARY_PLOT_HEIGHT = HEAT_PLOT_HEIGHT;
const BARY_PLOT_WIDTH = BARX_PLOT_HEIGHT;

const FPS = 120;

let run = false;
let reportType = '';

let eventSource: EventSource|undefined = undefined;
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
let subBuffer: Report[]|undefined;

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

const errorHandler = (error: any) => {
  eventError = true;
  console.error(
    `Error on GET /webds/report\n${error}`
  );
};

const eventHandler = (event: any) => {
  const data = JSON.parse(event.data);
  if ((reportType === 'Delta Image' && data.report[0] === 'delta') ||
      (reportType === 'Raw Image' && data.report[0] === 'raw') ||
      (reportType === 'Baseline Image' && data.report[0] === 'baseline')) {
    eventData = data.report[1];
  } else {
    eventData = undefined;
    return;
  }

  if ((eventData.image === undefined) || (buffer === undefined)) {
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
  if (eventSource && eventSource.readyState != SSE_CLOSED) {
    eventSource.removeEventListener('report', eventHandler, false);
    eventSource.close();
  }
};

const addEvent = () => {
  eventError = false;
  eventSource = new window.EventSource('/webds/report');
  eventSource.addEventListener('report', eventHandler, false);
  eventSource.addEventListener('error', errorHandler, false);
};

const setReport = async (disable: number[], enable: number[]): Promise<void> => {
  let status = false;
  removeEvent();
  const dataToSend = {enable, disable, fps: FPS};
  await requestAPI<any>('report', {
    body: JSON.stringify(dataToSend),
    method: 'POST'
  }).then(() => {
    addEvent();
    status = true;
  }).catch(reason => {
    console.error(
      `Error on POST /webds/report\n${reason}`
    );
  });
  return status ? Promise.resolve() : Promise.reject();
};

const HeatmapPlot = (props: any): JSX.Element => {
  const [show, setShow] = useState<boolean>(false);

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

  const barYLMargin = 20;
  const barYRMargin = 20;
  const barYTMargin = 20;
  const barYBMargin = 20;
  const barYHeight = BARY_PLOT_HEIGHT + barYTMargin + barYBMargin;
  const barYWidth = BARY_PLOT_WIDTH + barYLMargin + barYRMargin;

  const heatLMargin = 10;
  const heatRMargin = 120;
  const heatTMargin = barYTMargin;
  const heatBMargin = barYBMargin;
  const heatHeight = HEAT_PLOT_HEIGHT + heatTMargin + heatBMargin;
  const heatWidth = Math.floor(HEAT_PLOT_HEIGHT * props.numCols / props.numRows) + heatLMargin + heatRMargin;

  const barXLMargin = barYWidth + heatLMargin;
  const barXRMargin = 10;
  const barXTMargin = 10;
  const barXBMargin = 10;
  const barXHeight = BARX_PLOT_HEIGHT + barXTMargin + barXBMargin;
  const barXWidth = Math.floor(HEAT_PLOT_HEIGHT * props.numCols / props.numRows) + barXLMargin + barXRMargin;

  const plotConfig = {displayModeBar: false};

  let heatZ: number[][]|undefined;
  let heatZMin: number;
  let heatZMax: number;

  let barX: number[]|undefined;
  let barXMin: number|undefined;
  let barXMax: number|undefined;

  let barY: number[]|undefined;
  let barYMin: number|undefined;
  let barYMax: number|undefined;

  let t0: number;
  let t1: number;
  let requestID: number|undefined;

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

  const stopPlot = () => {
    stopAnimation();
    removeEvent();
  };

  const getMean = () => {
    if (subBuffer === undefined) {
      return undefined;
    }
    try {
      const mean = subBuffer.reduce(function(mean, cur) {
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
      }, {
        image: [...Array(props.numRows)].map(e => Array(props.numCols).fill(0)),
        hybridx: [...Array(props.numCols)].map(e => 0),
        hybridy: [...Array(props.numRows)].map(e => 0)
      });
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
      const max = subBuffer.reduce(function(max, cur) {
        for (let i = 0; i < props.numRows; i++) {
          for (let j = 0; j < props.numCols; j++) {
            max.image[i][j] = cur.image[i][j] > max.image[i][j] ? cur.image[i][j] : max.image[i][j];
          }
        }
        for (let i = 0; i < props.numCols; i++) {
          max.hybridx[i] = cur.hybridx[i] > max.hybridx[i] ? cur.hybridx[i] : max.hybridx[i];
        }
        for (let i = 0; i < props.numRows; i++) {
          max.hybridy[i] = cur.hybridy[i] > max.hybridy[i] ? cur.hybridy[i] : max.hybridy[i];
        }
        return max;
      }, {
        image: [...Array(props.numRows)].map(e => Array(props.numCols).fill(-Infinity)),
        hybridx: [...Array(props.numCols)].map(e => -Infinity),
        hybridy: [...Array(props.numRows)].map(e => -Infinity)
      });
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
      const min = subBuffer.reduce(function(min, cur) {
        for (let i = 0; i < props.numRows; i++) {
          for (let j = 0; j < props.numCols; j++) {
            min.image[i][j] = cur.image[i][j] < min.image[i][j] ? cur.image[i][j] : min.image[i][j];
          }
        }
        for (let i = 0; i < props.numCols; i++) {
          min.hybridx[i] = cur.hybridx[i] < min.hybridx[i] ? cur.hybridx[i] : min.hybridx[i];
        }
        for (let i = 0; i < props.numRows; i++) {
          min.hybridy[i] = cur.hybridy[i] < min.hybridy[i] ? cur.hybridy[i] : min.hybridy[i];
        }
        return min;
      }, {
        image: [...Array(props.numRows)].map(e => Array(props.numCols).fill(Infinity)),
        hybridx: [...Array(props.numCols)].map(e => Infinity),
        hybridy: [...Array(props.numRows)].map(e => Infinity)
      });
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
        image: [...Array(props.numRows)].map(e => Array(props.numCols)),
        hybridx: [...Array(props.numCols)],
        hybridy: [...Array(props.numRows)]
      };
      range.image = max.image.map(function(rArray, rIndex) {
        return rArray.map(function(maxElement, cIndex) {
          return maxElement - min.image[rIndex][cIndex];
        });
      });
      range.hybridx = max.hybridx.map(function(maxElement, index) {
        return maxElement - min.hybridx[index];
      });
      range.hybridy = max.hybridy.map(function(maxElement, index) {
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

    let result: Report|undefined;
    switch (statistics) {
      case 'Single':
        result = buffer[index];
        break;
      case 'Mean':
        result = getMean();
        break;
      case 'Max' :
        result = getMax();
        break;
      case 'Min' :
        result = getMin();
        break;
      case 'Range':
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
    if (!run) {
      requestID = requestAnimationFrame(animatePlot);
      return;
    }
    computePlot();
    if (heatZ === undefined || barX === undefined || barY === undefined) {
      requestID = requestAnimationFrame(animatePlot);
      return;
    }
    setHeatData(
      [{
        z: heatZ,
        zmin: heatZMin,
        zmax: heatZMax,
        type: 'heatmap',
        showscale: true,
        colorscale: 'Viridis',
        colorbar: {
          tickformat: '<-d',
          tickmode: 'array',
          tickvals: [heatZMin, heatZMax]
        }
      }]
    );
    setBarXLayout(
      {
        width: barXWidth,
        height: barXHeight,
        margin: {
          l: barXLMargin,
          r: barXRMargin,
          t: barXTMargin,
          b: barXBMargin
        },
        xaxis: {
          mirror: true,
          showline: true,
          showgrid: false,
          ticks: '',
          tickformat: '>-d',
          tickmode: 'array',
          tickvals: []
        },
        yaxis: {
          mirror: true,
          showline: true,
          showgrid: false,
          ticks: '',
          tickformat: '>-d',
          tickmode: 'array',
          tickvals: [barXMin, barXMax],
          range: [barXMin, barXMax],
          zerolinecolor: '#969696'
        }
      }
    );
    setBarXData(
      [{
        y: barX,
        type: 'bar',
        width: 0.5
      }]
    );
    setBarYLayout(
      {
        width: barYWidth,
        height: barYHeight,
        margin: {
          l: barYLMargin,
          r: barYRMargin,
          t: barYTMargin,
          b: barYBMargin
        },
        xaxis: {
          side: 'top',
          mirror: true,
          showline: true,
          showgrid: false,
          ticks: '',
          tickformat: '>-d',
          tickmode: 'array',
          tickvals: [barYMin, barYMax],
          range: [barYMin, barYMax],
          zerolinecolor: '#969696'
        },
        yaxis: {
          mirror: true,
          showline: true,
          showgrid: false,
          ticks: '',
          tickformat: '>-d',
          tickmode: 'array',
          tickvals: []
        }
      }
    );
    setBarYData(
      [{
        x: barY,
        type: 'bar',
        width: 0.5
      }]
    );
    t1 = Date.now();
    if (t1 - t0 >= 1000) {
      t0 = t1;
      props.updateSampleRate(fps);
    }
    setShow(true);
    requestID = requestAnimationFrame(animatePlot);
  };

  const startAnimation = () => {
    t0 = Date.now();
    t00 = Date.now();
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
    requestID = requestAnimationFrame(animatePlot);
  };

  const newPlot = async () => {
    reportType = props.reportType;
    stopAnimation();
    if (!reportType) {
      setShow(false);
      return;
    }
    setHeatConfig(plotConfig);
    setHeatLayout(
      {
        width: heatWidth,
        height: heatHeight,
        margin: {
          l: heatLMargin,
          r: heatRMargin,
          t: heatTMargin,
          b: heatBMargin
        },
        xaxis: {
          ticks: '',
          showticklabels: false
        },
        yaxis: {
          ticks: '',
          showticklabels: false
        }
      }
    );
    setBarXConfig(plotConfig);
    setBarYConfig(plotConfig);
    try {
      if (reportType === 'Delta Image') {
        await setReport([REPORT_TOUCH, REPORT_RAW, REPORT_BASELINE], [REPORT_DELTA]);
      } else if (reportType === 'Raw Image') {
        await setReport([REPORT_TOUCH, REPORT_DELTA, REPORT_BASELINE], [REPORT_RAW]);
      } else if (reportType === 'Baseline Image') {
        await setReport([REPORT_TOUCH, REPORT_DELTA, REPORT_RAW], [REPORT_BASELINE]);
      }
    } catch {
      props.resetReportType();
      return;
    }
    startAnimation();
  };

  useEffect(() => {
    newPlot();
    return () => {stopPlot();}
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

  return (
    <div style={{height: (50 + heatHeight + barXHeight) + 'px', display: 'flex', alignItems: 'center'}}>
      {show ? (
        <div>
          <div style={{width: (heatWidth) + 'px', height: '50px', fontSize: '20px', textAlign: 'center'}}>
            {reportType}
          </div>
          <div style={{display: 'flex', flexWrap: 'nowrap'}}>
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
      ) : (
        <div style={{paddingLeft: '50px', fontSize: '18px'}}>
          Please select report type
        </div>
      )}
    </div>
  );
};

export default HeatmapPlot;
