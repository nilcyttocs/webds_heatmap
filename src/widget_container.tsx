import { ReactWidget } from '@jupyterlab/apputils';
import React from 'react';

import { HeatmapMui } from './widget_mui';

const HeatmapContainer = (props:any): JSX.Element => {
  return (
    <HeatmapMui/>
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
}
