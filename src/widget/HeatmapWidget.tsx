import React from "react";

import { ReactWidget } from "@jupyterlab/apputils";

import { WebDSService } from "@webds/service";

import HeatmapComponent from "./HeatmapComponent";

export let webdsService: WebDSService;

export class HeatmapWidget extends ReactWidget {
  id: string;
  service: WebDSService;

  constructor(id: string, service: WebDSService) {
    super();
    this.id = id;
    this.service = service;
  }

  render(): JSX.Element {
    webdsService = this.service;
    return (
      <div id={this.id + "_component"}>
        <HeatmapComponent />
      </div>
    );
  }
}

export default HeatmapWidget;
