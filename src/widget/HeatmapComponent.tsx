import React, { useEffect, useState } from 'react';

import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import { ThemeProvider } from '@mui/material/styles';
import { TouchcommADCReport } from '@webds/service';

import Landing from './Landing';
import { webdsService } from './local_exports';
import Playback from './Playback';

export enum Page {
  Landing = 'LANDING',
  Playback = 'PLAYBACK'
}

export type ADCData = TouchcommADCReport[];

export const ADCDataContext = React.createContext([] as ADCData);

export const selectFile = async (
  event: React.ChangeEvent<HTMLInputElement>
): Promise<any> => {
  if (event.target.files === null) {
    return Promise.reject('No file selected');
  }
  let data: any = await event.target.files[0].text();
  if (data.length > 0) {
    try {
      data = JSON.parse(data);
      if (
        !data.data ||
        data.data.length === 0 ||
        (data.data[0][0] !== 'delta' &&
          data.data[0][0] !== 'raw' &&
          data.data[0][0] !== 'baseline')
      ) {
        return Promise.reject('No valid JSON data content');
      }
    } catch (error) {
      return Promise.reject('Invalid file content');
    }
  } else {
    return Promise.reject('No file content');
  }
  return data;
};

export const HeatmapComponent = (props: any): JSX.Element => {
  const [initialized, setInitialized] = useState<boolean>(false);
  const [alert, setAlert] = useState<string | undefined>(undefined);
  const [page, setPage] = useState<Page>(Page.Landing);
  const [adcData, setADCData] = useState<ADCData>([]);
  const [dataCounter, setDataCounter] = useState<number>(0);

  const webdsTheme = webdsService.ui.getWebDSTheme();

  const changePage = (newPage: Page) => {
    setPage(newPage);
  };

  const displayPage = (): JSX.Element | null => {
    switch (page) {
      case Page.Landing:
        return (
          <Landing
            setAlert={setAlert}
            changePage={changePage}
            setADCData={setADCData}
            setDataCounter={setDataCounter}
          />
        );
      case Page.Playback:
        return (
          <Playback
            setAlert={setAlert}
            changePage={changePage}
            setADCData={setADCData}
            dataCounter={dataCounter}
            setDataCounter={setDataCounter}
          />
        );
      default:
        return null;
    }
  };

  const initialize = async () => {
    setInitialized(true);
  };

  useEffect(() => {
    initialize();
  }, []);

  return (
    <>
      <ThemeProvider theme={webdsTheme}>
        <div className="jp-webds-widget-body">
          {alert !== undefined && (
            <Alert
              severity="error"
              onClose={() => setAlert(undefined)}
              sx={{ whiteSpace: 'pre-wrap' }}
            >
              {alert}
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
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)'
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
