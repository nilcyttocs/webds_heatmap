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
      heat = undefined;
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
      heat = undefined;
      return;
    } else {
      heat = result.image;
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
