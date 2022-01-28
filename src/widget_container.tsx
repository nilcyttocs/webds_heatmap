import { ReactWidget } from '@jupyterlab/apputils';
import React, { useState, useEffect } from 'react';

import CircularProgress from '@mui/material/CircularProgress';

import { HeatmapMui } from './widget_mui';

import { requestAPI } from './handler';

const HeatmapContainer = (props: any): JSX.Element => {
  const [dimensions, setDimensions] = useState<any>([]);

  const getDeviceInfo = async () => {
    await requestAPI<any>('command?query=app-info')
    .then(data => {
      if (data.numCols && data.numRows) {
        setDimensions([data.numCols, data.numRows]);
      }
    }).catch(reason => {
      console.error(
        `Error on GET /webds/command?query=app-info\n${reason}`
      );
    });
  };

  useEffect(() => {
    getDeviceInfo();
  }, []);

  return (
    <div>
      {dimensions.length ? (
        <HeatmapMui numCols={dimensions[0]} numRows={dimensions[1]}/>
      ) : (
        <div style={{marginLeft: 200, marginTop: 200}}>
          <CircularProgress color='primary'/>
        </div>
      )}
    </div>
  );
};

export class HeatmapWidget extends ReactWidget {
  render(): JSX.Element {
    return (
      <div className='jp-webdsHeatmap-container'>
        <HeatmapContainer/>
      </div>
    );
  }
};
