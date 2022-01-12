import React, { useState, useEffect } from 'react';

import Plot from 'react-plotly.js';

import { requestAPI } from './handler';

const SSE_CLOSED = 2

const REPORT_TOUCH = 17;
const REPORT_DELTA = 18;
const REPORT_RAW = 19;

let eventSource: EventSource|undefined = undefined;
let eventData: number[][]|undefined = undefined;
let eventError: boolean = false;

const errorHandler = (error: any) => {
  eventError = true;
  console.error(
    `Error on GET /webds/report\n${error}`
  );
}

const eventHandler = (event: any) => {
  let report = JSON.parse(event.data);
  eventData = report.image;
}

const removeEvent = () => {
  if (eventSource && eventSource.readyState != SSE_CLOSED) {
    eventSource.removeEventListener('report', eventHandler, false);
    eventSource.close();
  }
}

const addEvent = () => {
  eventError = false;
  eventSource = new window.EventSource('/webds/report');
  eventSource.addEventListener('report', eventHandler, false);
  eventSource.addEventListener('error', errorHandler, false);
}

const setReport = async (disable: number[], enable: number[]) => {
  removeEvent();
  const dataToSend = {enable, disable};
  await requestAPI<any>('report', {
    body: JSON.stringify(dataToSend),
    method: 'POST'
  }).then(() => {
    addEvent();
  }).catch(reason => {
    console.error(
      `Error on POST /webds/report\n${reason}`
    );
  });
}

const HeatmapPlot = (props: any): JSX.Element => {
  const l = 30;
  const t = 40;
  const plotConfig = {displayModeBar: false};

  const [running, setRunning] = useState<boolean>(false);
  const [data, setData] = useState<any>([]);
  const [layout, setLayout] = useState<any>({});
  const [frames, setFrames] = useState<any>([]);
  const [config, setConfig] = useState<any>({});

  const storeState = (figure: any) => {
    setData(figure.data);
    setLayout(figure.layout);
    setFrames(figure.frames);
    setConfig(figure.config);
  }

  let heat: number[][]|undefined;
  let minZ: number;
  let maxZ: number;
  let t0: number;
  let t1: number;
  let frameCount: number;
  let requestID: number|undefined;
  let reportType: string|undefined;

  const stopAnimation = () => {
    setRunning(false);
    if (requestID) {
      cancelAnimationFrame(requestID);
      requestID = undefined;
      reportType = undefined;
    }
  }

  const stopPlot = async () => {
    stopAnimation();
    removeEvent();
  }

  const computePlot = async () => {
    heat = eventData;
    if (heat === undefined) {
      return;
    }
    let minRow = heat!.map((row: number[]) => {
      return Math.min.apply(Math, row);
    });
    minZ = Math.min.apply(null, minRow);
    let maxRow = heat!.map((row: number[]) => {
      return Math.max.apply(Math, row);
    });
    maxZ = Math.max.apply(null, maxRow);
  }

  const animatePlot = () => {
    if (eventError) {
      props.resetReportType();
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
        type: 'heatmap',
        showscale: true,
        colorscale: 'Viridis',
        colorbar: {
          tickformat: '+04d',
          tickmode: 'array',
          tickvals: [minZ, maxZ]
        },
        zmin: minZ,
        zmax: maxZ
      }]
    );
    frameCount++;
    t1 = Date.now();
    if (t1 - t0 >= 3000) {
      t0 = t1;
      const fps = Math.floor(frameCount / 3);
      console.log(`Heatmap FPS = ${fps}`);
      frameCount = 0;
    }
    if (reportType === props.reportType) {
      setRunning(true);
      requestID = requestAnimationFrame(animatePlot);
    }
  }

  const startAnimation = () => {
    t0 = Date.now();
    frameCount = 0;
    eventData = undefined;
    reportType = props.reportType;
    requestID = requestAnimationFrame(animatePlot);
  }

  const runPlot = async () => {
    stopAnimation();
    if (props.reportType === 'Delta Image') {
      setReport([REPORT_TOUCH, REPORT_RAW], [REPORT_DELTA]);
    } else if (props.reportType === 'Raw Image') {
      setReport([REPORT_TOUCH, REPORT_DELTA], [REPORT_RAW]);
    } else {
      return;
    }
    await requestAPI<any>('command?query=app-info')
    .then(data => {
      let width = data.numCols * 25 + l;
      let height = data.numRows * 25 + t;
      setLayout({width, height, title: props.reportType, margin: {l, t}});
      setConfig(plotConfig);
      startAnimation();
    }).catch(reason => {
      console.error(
        `Error on GET /webds/command?query=app-info\n${reason}`
      );
    });
  }

  useEffect(() => {
    runPlot();
    return () => {stopPlot();}
  }, [props.reportType]);

  return (
    <div>
      {running ? (
        <Plot
          data={data}
          layout={layout}
          frames={frames}
          config={config}
          onInitialized={(figure) => storeState(figure)}
          onUpdate={(figure) => storeState(figure)}
        />
      ) : (
        null
      )}
    </div>
  );
}

export default HeatmapPlot;
