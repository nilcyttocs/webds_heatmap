import React, { useState, useEffect } from 'react';

import Plot from 'react-plotly.js';

import { requestAPI } from './handler';

const SSE_CLOSED = 2

const REPORT_TOUCH = 17;
const REPORT_DELTA = 18;
const REPORT_RAW = 19;
const REPORT_BASELINE = 20;

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

type ReportBuffer = {
  image: number[][][];
  hybridx: number[][];
  hybridy: number[][];
};

const bufferSize = 1000;
let buffer: ReportBuffer;
let subBuffer: ReportBuffer|undefined;

let t00: number;
let t11: number;
let fps: number;
let eventCount: number;

const updateSubBuffer = () => {
  const end = index;
  const start = index - samples;
  if (start < 0) {
    subBuffer = {
      image: [...buffer.image.slice(start), ...buffer.image.slice(0, end)],
      hybridx: [...buffer.hybridx.slice(start), ...buffer.hybridx.slice(0, end)],
      hybridy: [...buffer.hybridy.slice(start), ...buffer.hybridy.slice(0, end)]
    };
  } else {
    subBuffer = {
      image: buffer.image.slice(start, end),
      hybridx: buffer.hybridx.slice(start, end),
      hybridy: buffer.hybridy.slice(start, end)
    };
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
  buffer.image[index] = eventData.image;
  buffer.hybridx[index] = eventData.hybridx;
  buffer.hybridy[index] = eventData.hybridy;

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
  const [data, setData] = useState<any>([]);
  const [config, setConfig] = useState<any>({});
  const [layout, setLayout] = useState<any>({});
  const [frames, setFrames] = useState<any>([]);

  const l = 0;
  const r = 120;
  const t = 0;
  const b = 0;
  const height = 400;
  const width = Math.floor(height * props.numCols / props.numRows) + r;

  const plotConfig = {displayModeBar: false};

  let heat: number[][]|undefined;
  let minZ: number;
  let maxZ: number;
  let t0: number;
  let t1: number;
  let requestID: number|undefined;

  const storeState = (figure: any) => {
    setData(figure.data);
    setLayout(figure.layout);
    setFrames(figure.frames);
    setConfig(figure.config);
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
      heat = undefined;
      return;
    }
    try {
      heat = subBuffer.image.reduce(function(mean, cur) {
        for (let i = 0; i < props.numRows; i++) {
          for (let j = 0; j < props.numCols; j++) {
            mean[i][j] += cur[i][j] / samples;
          }
        }
        return mean;
      }, [...Array(props.numRows)].map(e => Array(props.numCols).fill(0)));
    } catch {
      heat = undefined;
    }
  };

  const getMax = () => {
    if (subBuffer === undefined) {
      heat = undefined;
      return;
    }
    try {
      heat = subBuffer.image.reduce(function(max, cur) {
        for (let i = 0; i < props.numRows; i++) {
          for (let j = 0; j < props.numCols; j++) {
            max[i][j] = cur[i][j] > max[i][j] ? cur[i][j] : max[i][j];
          }
        }
        return max;
      }, [...Array(props.numRows)].map(e => Array(props.numCols).fill(-Infinity)));
    } catch {
      heat = undefined;
    }
  };

  const getMin = () => {
    if (subBuffer === undefined) {
      heat = undefined;
      return;
    }
    try {
      heat = subBuffer.image.reduce(function(min, cur) {
        for (let i = 0; i < props.numRows; i++) {
          for (let j = 0; j < props.numCols; j++) {
            min[i][j] = cur[i][j] < min[i][j] ? cur[i][j] : min[i][j];
          }
        }
        return min;
      }, [...Array(props.numRows)].map(e => Array(props.numCols).fill(Infinity)));
    } catch {
      heat = undefined;
    }
  };

  const getRange = () => {
    if (subBuffer === undefined) {
      heat = undefined;
      return;
    }
    try {
      const max: number[][] = subBuffer.image.reduce(function(max, cur) {
        for (let i = 0; i < props.numRows; i++) {
          for (let j = 0; j < props.numCols; j++) {
            max[i][j] = cur[i][j] > max[i][j] ? cur[i][j] : max[i][j];
          }
        }
        return max;
      }, [...Array(props.numRows)].map(e => Array(props.numCols).fill(-Infinity)));

      const min: number[][] = subBuffer.image.reduce(function(min, cur) {
        for (let i = 0; i < props.numRows; i++) {
          for (let j = 0; j < props.numCols; j++) {
            min[i][j] = cur[i][j] < min[i][j] ? cur[i][j] : min[i][j];
          }
        }
        return min;
      }, [...Array(props.numRows)].map(e => Array(props.numCols).fill(Infinity)));

      heat = max.map(function(rArray, rIndex) {
        return rArray.map(function(maxElement, cIndex) {
          return maxElement - min[rIndex][cIndex];
        });
      });
    } catch {
      heat = undefined;
    }
  };

  const computePlot = () => {
    if (eventData === undefined) {
      heat = undefined;
      return;
    }
    switch (statistics) {
      case 'Single':
        heat = buffer.image[index];
        break;
      case 'Mean':
        getMean();
        break;
      case 'Max' :
        getMax();
        break;
      case 'Min' :
        getMin();
        break;
      case 'Range':
        getRange();
        break;
      default:
        heat = undefined;
        break;
    }
    if (heat === undefined) {
      return;
    }
    const minRow = heat!.map((row: number[]) => {
      return Math.min.apply(Math, row);
    });
    minZ = Math.min.apply(Math, minRow);
    const maxRow = heat!.map((row: number[]) => {
      return Math.max.apply(Math, row);
    });
    maxZ = Math.max.apply(Math, maxRow);
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
    if (heat === undefined) {
      requestID = requestAnimationFrame(animatePlot);
      return;
    }
    setData(
      [{
        z: heat,
        zmin: minZ,
        zmax: maxZ,
        type: 'heatmap',
        showscale: true,
        colorscale: 'Viridis',
        colorbar: {
          tickformat: '<-d',
          tickmode: 'array',
          tickvals: [minZ, maxZ]
        }
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
    eventCount = 0;
    eventData = undefined;
    index = bufferSize - 1;
    filled = false;
    buffer = {
      image: new Array(bufferSize),
      hybridx: new Array(bufferSize),
      hybridy: new Array(bufferSize),
    };
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
    setConfig(plotConfig);
    setLayout(
      {
        width,
        height,
        margin: {l, r, t, b},
        xaxis: {
          showticklabels: false
        },
        yaxis: {
          showticklabels: false
        }
      }
    );
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
    <div style={{height: (height + 50) + 'px', display: 'flex', alignItems: 'center'}}>
      {show ? (
        <div>
          <div style={{width: (width - r) + 'px', height: '50px', fontSize: '20px', textAlign: 'center'}}>
            {reportType}
          </div>
          <Plot
            data={data}
            layout={layout}
            frames={frames}
            config={config}
            onInitialized={(figure) => storeState(figure)}
            onUpdate={(figure) => storeState(figure)}
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
