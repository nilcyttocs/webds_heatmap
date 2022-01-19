import React, { useState, useEffect } from 'react';

import Plot from 'react-plotly.js';

import { requestAPI } from './handler';

const SSE_CLOSED = 2

const REPORT_TOUCH = 17;
const REPORT_DELTA = 18;
const REPORT_RAW = 19;

const PLOT_SCALE = 20;

let run = false;

let eventSource: EventSource|undefined = undefined;
let eventData: number[][]|undefined = undefined;
let eventError = false;

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

const setReport = async (disable: number[], enable: number[]): Promise<void> => {
  let status = false;
  removeEvent();
  const dataToSend = {enable, disable};
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
}

const HeatmapPlot = (props: any): JSX.Element => {
  const [show, setShow] = useState<boolean>(false);
  const [data, setData] = useState<any>([]);
  const [config, setConfig] = useState<any>({});
  const [layout, setLayout] = useState<any>({});
  const [frames, setFrames] = useState<any>([]);

  const l = 30;
  const t = 40;
  const b = 20;
  const width = props.numCols * PLOT_SCALE + l;
  const height = props.numRows * PLOT_SCALE + t;

  const plotConfig = {displayModeBar: false};

  let heat: number[][]|undefined;
  let minZ: number;
  let maxZ: number;
  let t0: number;
  let t1: number;
  let frameCount: number;
  let requestID: number|undefined;

  const storeState = (figure: any) => {
    setData(figure.data);
    setLayout(figure.layout);
    setFrames(figure.frames);
    setConfig(figure.config);
  }

  const stopAnimation = () => {
    if (requestID) {
      cancelAnimationFrame(requestID);
      requestID = undefined;
    }
  }

  const stopPlot = () => {
    stopAnimation();
    removeEvent();
  }

  const computePlot = () => {
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
    setShow(true);
    requestID = requestAnimationFrame(animatePlot);
  }

  const startAnimation = () => {
    t0 = Date.now();
    frameCount = 0;
    eventData = undefined;
    requestID = requestAnimationFrame(animatePlot);
  }

  const newPlot = async () => {
    stopAnimation();
    if (!props.reportType) {
      setShow(false);
      return;
    }
    try {
      if (props.reportType === 'Delta Image') {
        await setReport([REPORT_TOUCH, REPORT_RAW], [REPORT_DELTA]);
      } else if (props.reportType === 'Raw Image') {
        await setReport([REPORT_TOUCH, REPORT_DELTA], [REPORT_RAW]);
      }
    } catch {
      props.resetReportType();
      return;
    }
    setConfig(plotConfig);
    setLayout(
      {
        width,
        height,
        margin: {l, t, b},
        title: {
          font: {
            family: 'Arial',
            size: 18
          },
          text: props.reportType
        }
      }
    );
    startAnimation();
  }

  useEffect(() => {
    newPlot();
    return () => {stopPlot();}
  }, [props.reportType]);

  useEffect(() => {
    run = props.run;
  }, [props.run]);

  return (
    <div style={{height: height, display: 'flex', alignItems: 'center'}}>
      {show ? (
        <Plot
          data={data}
          layout={layout}
          frames={frames}
          config={config}
          onInitialized={(figure) => storeState(figure)}
          onUpdate={(figure) => storeState(figure)}
        />
      ) : (
        <div style={{paddingLeft: 30, fontSize: 18}}>Please select report type</div>
      )}
    </div>
  );
}

export default HeatmapPlot;
