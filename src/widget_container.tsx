import React, { useEffect, useState } from "react";

import { ReactWidget } from "@jupyterlab/apputils";

import Alert from "@mui/material/Alert";

import CircularProgress from "@mui/material/CircularProgress";

import { ThemeProvider } from "@mui/material/styles";

import { WebDSService } from "@webds/service";

import { HeatmapMui } from "./widget_mui";

import { requestAPI } from "./handler";

let alertMessage = "";

const alertMessageAppInfo = "Failed to read application info from device.";

const HeatmapContainer = (props: any): JSX.Element => {
  const [initialized, setInitialized] = useState<boolean>(false);
  const [alert, setAlert] = useState<boolean>(false);
  const [dimensions, setDimensions] = useState<any>([]);

  const initialize = async () => {
    try {
      const data = await requestAPI<any>("command?query=app-info");
      if (data.numCols && data.numRows) {
        setDimensions([data.numCols, data.numRows]);
      }
    } catch (error) {
      console.error(`Error - GET /webds/command?query=app-info\n${error}`);
      alertMessage = alertMessageAppInfo;
      setAlert(true);
      return;
    }
    setInitialized(true);
  };

  useEffect(() => {
    initialize();
  }, []);

  const webdsTheme = props.service.ui.getWebDSTheme();
  const jpFontColor = props.service.ui.getJupyterFontColor();

  return (
    <div className="jp-webds-widget-body">
      <ThemeProvider theme={webdsTheme}>
        {initialized ? (
          <HeatmapMui
            numCols={dimensions[0]}
            numRows={dimensions[1]}
            fontColor={jpFontColor}
          />
        ) : (
          <>
            <div
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)"
              }}
            >
              <CircularProgress color="primary" />
            </div>
            {alert ? (
              <Alert
                severity="error"
                onClose={() => setAlert(false)}
                sx={{ whiteSpace: "pre-wrap" }}
              >
                {alertMessage}
              </Alert>
            ) : null}
          </>
        )}
      </ThemeProvider>
    </div>
  );
};

export class HeatmapWidget extends ReactWidget {
  service: WebDSService | null = null;

  constructor(service: WebDSService) {
    super();
    this.service = service;
  }

  render(): JSX.Element {
    return (
      <div className="jp-webds-widget">
        <HeatmapContainer service={this.service} />
      </div>
    );
  }
}
