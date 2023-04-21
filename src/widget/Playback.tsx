import React, { useContext, useState } from 'react';

import Button from '@mui/material/Button';

import ADCPlayback from './adc_plots/ADCPlayback';
import { ALERT_MESSAGE_LOAD_FILE } from './constants';
import { Page, selectFile } from './HeatmapComponent';
import { ADCDataContext } from './local_exports';
import {
  PauseRunToggle,
  StopButton,
  UploadButton
} from './mui_extensions/Buttons';
import { Canvas } from './mui_extensions/Canvas';
import { Content } from './mui_extensions/Content';
import { Controls } from './mui_extensions/Controls';
import PlaybackProgress from './playback_controls/PlaybackProgress';
import PlaybackSlider from './playback_controls/PlaybackSlider';
import PlaybackSpeed from './playback_controls/PlaybackSpeed';

export const Playback = (props: any): JSX.Element => {
  const [run, setRun] = useState<boolean>(false);
  const [frameIndex, setFrameIndex] = useState<number>(0);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(0);

  const adcData = useContext(ADCDataContext);

  const handleBackButtonClick = () => {
    props.changePage(Page.Landing);
  };

  const handleUploadButtonClick = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    try {
      const data = await selectFile(event);
      setRun(false);
      props.setADCData(data.data);
      props.setDataCounter((prev: number) => prev + 1);
      setTimeout(() => {
        setFrameIndex(0);
      }, 1);
    } catch (error) {
      console.error(error);
      props.setAlert(ALERT_MESSAGE_LOAD_FILE);
      return;
    }
  };

  return (
    <Canvas title="ADC Playback">
      <Content
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        {adcData.length > 0 ? (
          <ADCPlayback
            run={run}
            setRun={setRun}
            speed={playbackSpeed}
            frameIndex={frameIndex}
            setFrameIndex={setFrameIndex}
            numFrames={adcData.length}
            dataCounter={props.dataCounter}
          />
        ) : null}
      </Content>
      <Controls
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <div
          style={{
            width: '100%',
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <UploadButton
            input={
              <input
                hidden
                type="file"
                accept=".json"
                onChange={handleUploadButtonClick}
              />
            }
          />
          <div
            style={{
              width: '100%',
              margin: '0px 16px',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            {run ? (
              <div style={{ width: '100%' }}>
                <PlaybackProgress
                  frameIndex={frameIndex}
                  numFrames={adcData.length}
                />
              </div>
            ) : (
              <PlaybackSlider
                frameIndex={frameIndex}
                setFrameIndex={setFrameIndex}
                numFrames={adcData.length}
                sx={{ display: 'flex', alignItems: 'center' }}
              />
            )}
          </div>
          <PauseRunToggle
            running={run}
            disabled={adcData.length === 0}
            onClick={() => {
              setRun(!run);
            }}
          />
          <StopButton
            disabled={adcData.length === 0}
            onClick={() => {
              setRun(false);
              setTimeout(() => {
                setFrameIndex(0);
              }, 1);
            }}
          />
          <div style={{ marginLeft: '8px' }}>
            <PlaybackSpeed
              disabled={adcData.length === 0}
              setPlaybackSpeed={setPlaybackSpeed}
            />
          </div>
        </div>
        <div style={{ marginTop: '24px' }}>
          <Button onClick={handleBackButtonClick} sx={{ width: '150px' }}>
            Back
          </Button>
        </div>
      </Controls>
    </Canvas>
  );
};

export default Playback;
