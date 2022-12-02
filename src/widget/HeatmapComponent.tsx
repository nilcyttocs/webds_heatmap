import React, { useEffect, useState } from "react";

import Alert from "@mui/material/Alert";

import CircularProgress from "@mui/material/CircularProgress";

import { ThemeProvider } from "@mui/material/styles";

import { TouchcommADCReport } from "@webds/service";

import Landing from "./Landing";

import Playback from "./Playback";

import { ALERT_MESSAGE_APP_INFO } from "./constants";

import { requestAPI } from "../handler";

export enum Page {
  Landing = "LANDING",
  Playback = "PLAYBACK"
}

export type ADCData = TouchcommADCReport[];

export const ADCDataContext = React.createContext({} as ADCData);

let alertMessage = "";

export const selectFile = async (
  event: React.ChangeEvent<HTMLInputElement>
): Promise<any> => {
  if (event.target.files === null) {
    return Promise.reject("No file selected");
  }
  let data: any = await event.target.files[0].text();
  if (data.length > 0) {
    try {
      data = JSON.parse(data);
      if (!data.data || data.data.length === 0) {
        return Promise.reject("No valid JSON data content");
      }
    } catch (error) {
      return Promise.reject("Invalid file content");
    }
  } else {
    return Promise.reject("No file content");
  }
  return data;
};

export const HeatmapComponent = (props: any): JSX.Element => {
  const [initialized, setInitialized] = useState<boolean>(false);
  const [alert, setAlert] = useState<boolean>(false);
  const [page, setPage] = useState<Page>(Page.Landing);
  const [colsRows, setColsRows] = useState<[number, number]>([0, 0]);
  const [adcData, setADCData] = useState<ADCData>([]);

  const webdsTheme = props.service.ui.getWebDSTheme();

  const showAlert = (message: string) => {
    alertMessage = message;
    setAlert(true);
  };

  const changePage = (newPage: Page) => {
    setPage(newPage);
  };

  const displayPage = (): JSX.Element | null => {
    switch (page) {
      case Page.Landing:
        return (
          <Landing
            showAlert={showAlert}
            changePage={changePage}
            numCols={colsRows[0]}
            numRows={colsRows[1]}
            setADCData={setADCData}
          />
        );
      case Page.Playback:
        return (
          <Playback
            showAlert={showAlert}
            changePage={changePage}
            numCols={colsRows[0]}
            numRows={colsRows[1]}
            setADCData={setADCData}
          />
        );
      default:
        return null;
    }
  };

  const initialize = async () => {
    const dataToSend: any = {
      command: "getAppInfo"
    };
    try {
      const response = await requestAPI<any>("command", {
        body: JSON.stringify(dataToSend),
        method: "POST"
      });
      if (response.numCols && response.numRows) {
        setColsRows([response.numCols, response.numRows]);
      }
    } catch (error) {
      console.error(`Error - POST /webds/command\n${dataToSend}\n${error}`);
      showAlert(ALERT_MESSAGE_APP_INFO);
      return;
    }
    setInitialized(true);
  };

  useEffect(() => {
    initialize();
  }, []);

  return (
    <>
      <ThemeProvider theme={webdsTheme}>
        <div className="jp-webds-widget-body">
          {alert && (
            <Alert
              severity="error"
              onClose={() => setAlert(false)}
              sx={{ whiteSpace: "pre-wrap" }}
            >
              {alertMessage}
            </Alert>
          )}
          {initialized && (
            <ADCDataContext.Provider value={adcData}>
              {displayPage()}
            </ADCDataContext.Provider>
          )}
        </div>
        {!initialized && (
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
        )}
      </ThemeProvider>
    </>
  );
};

export default HeatmapComponent;
