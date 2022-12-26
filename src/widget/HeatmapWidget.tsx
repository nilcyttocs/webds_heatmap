import React from "react";

import { ReactWidget } from "@jupyterlab/apputils";

import HeatmapComponent from "./HeatmapComponent";

export class HeatmapWidget extends ReactWidget {
  id: string;

  constructor(id: string) {
    super();
    this.id = id;
  }

  render(): JSX.Element {
    return (
      <div id={this.id + "_component"}>
        <HeatmapComponent />
      </div>
    );
  }
}

export default HeatmapWidget;
