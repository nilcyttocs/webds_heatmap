import { ReactWidget } from '@jupyterlab/apputils';
import React, { useState, useEffect } from 'react';

import CircularProgress from '@mui/material/CircularProgress';

import { WebDSService } from '@webds/service';

import { HeatmapMui } from './widget_mui';

import { requestAPI } from './handler';

const HeatmapContainer = (props: any): JSX.Element => {
  const [dimensions, setDimensions] = useState<any>([]);

  const getDeviceInfo = async () => {
    try {
      const data = await requestAPI<any>('command?query=app-info');
      if (data.numCols && data.numRows) {
        setDimensions([data.numCols, data.numRows]);
      }
    } catch (error) {
      console.error(`Error - GET /webds/command?query=app-info\n${error}`);
    }
  };

  useEffect(() => {
    getDeviceInfo();
  }, []);

  const webdsTheme = props.service.ui.getWebDSTheme();
  const jpFontColor = props.service.ui.getJupyterFontColor();

  return (
    <div className='jp-webds-widget-body'>
      {dimensions.length ? (
        <HeatmapMui numCols={dimensions[0]} numRows={dimensions[1]} theme={webdsTheme} fontColor={jpFontColor}/>
      ) : (
        <div style={{marginLeft: 200, marginTop: 200}}>
          <CircularProgress color='primary'/>
        </div>
      )}
    </div>
  );
};

export class HeatmapWidget extends ReactWidget {
  service: WebDSService|null = null;

  constructor(service: WebDSService) {
    super();
    this.service = service;
  }

  render(): JSX.Element {
    return (
      <div className='jp-webds-widget'>
        <HeatmapContainer service={this.service}/>
      </div>
    );
  }
};
