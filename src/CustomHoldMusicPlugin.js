import React from 'react';
import { Actions, VERSION } from '@twilio/flex-ui';
import { FlexPlugin } from '@twilio/flex-plugin';

const PLUGIN_NAME = 'CustomHoldMusicPlugin';

export default class CustomHoldMusicPlugin extends FlexPlugin {
  constructor() {
    super(PLUGIN_NAME);
  }

  /**
   * This code is run when your plugin is being started
   * Use this to modify any UI components or attach to the actions framework
   *
   * @param flex { typeof import('@twilio/flex-ui') }
   * @param manager { import('@twilio/flex-ui').Manager }
   */
  init(flex, manager) {
    console.debug('Running Flex UI version', VERSION);

    const musicTwimlUrl = 'https://folly-rail-4787.twil.io/twiml-play-music?type=music';
    const ringbackTwimlUrl = 'https://folly-rail-4787.twil.io/twiml-play-music?type=ringback';

    flex.Actions.addListener('beforeHoldCall', async payload => {
      const { holdMusicType } = payload;

      switch (holdMusicType) {
        case 'music': {
          payload.holdMusicUrl = musicTwimlUrl;
          break;
        }
        case 'ringback': {
          payload.holdMusicUrl = ringbackTwimlUrl;
          break;
        }
        default: {
          payload.holdMusicUrl = musicTwimlUrl;
        }
      }
    });

    flex.Actions.addListener('afterHoldCall', payload => {
      const { transferTaskPayload } = payload;

      if (transferTaskPayload) {
        flex.Actions.invokeAction('TransferTask', { ...transferTaskPayload, isHoldComplete: true })
      }
    })

    // flex.Actions.addListener('beforeTransferTask', async (payload, abortAction) => {
      // const { isHoldComplete, options, targetSid, task } = payload;
      // const mode = options?.mode;

      // if (!mode || !targetSid || isHoldComplete) {
      //   return;
      // }

      
      // let targetType;
      
      // if (targetSid.toLowerCase().startsWith('wq')) {
      //   targetType = 'queue';
      // }
      // if (targetSid.toLowerCase().startsWith('wk')) {
      //   targetType = 'worker';
      // }
      
      // let holdMusicType;

      // switch (mode.toLowerCase()) {
      //   case 'warm': {
      //     holdMusicType = 'music';
      //     break;
      //   }
      //   case 'cold': {
      //     holdMusicType = targetType === 'worker' ? 'ringback' : 'music';
      //     break;
      //   }
      //   default: {
      //     holdMusicType = 'music';
      //   }
      // }

    //   flex.Actions.invokeAction('HoldCall', { task, holdMusicType, transferTaskPayload: payload });
    //   abortAction();
    // });

    flex.Actions.addListener('beforeTransferTask', (payload) => new Promise(resolve => {
      const { isHoldComplete, options, targetSid, task } = payload;
      const mode = options?.mode;

      if (!mode || !targetSid || isHoldComplete) {
        return;
      }

      
      let targetType;
      
      if (targetSid.toLowerCase().startsWith('wq')) {
        targetType = 'queue';
      }
      if (targetSid.toLowerCase().startsWith('wk')) {
        targetType = 'worker';
      }
      
      let holdMusicType;

      switch (mode.toLowerCase()) {
        case 'warm': {
          holdMusicType = 'music';
          break;
        }
        case 'cold': {
          holdMusicType = targetType === 'worker' ? 'ringback' : 'music';
          break;
        }
        default: {
          holdMusicType = 'music';
        }
      }

      flex.Actions.invokeAction('HoldCall', { task, holdMusicType });
      
      const interval = setInterval(() => {
        const conference = task?.conference;
        console.debug('HoldCall: Conference', conference);
        const customerParticipant = conference?.participants?.find(p => p.participantType === 'customer');

        console.debug('HoldCall: customerParticipant', customerParticipant);
        if (customerParticipant?.onHold) {
          console.debug('HoldCall: customer now on hold');
          clearInterval(interval);
          return resolve();
        }
      }, 500);
    }));


  }
}
