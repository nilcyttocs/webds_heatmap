import {
  ILayoutRestorer,
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';

import {
  MainAreaWidget,
  WidgetTracker
} from '@jupyterlab/apputils';

import { ILauncher } from '@jupyterlab/launcher';

import { heatmapIcon } from './icons';

import { HeatmapWidget } from './widget_container';

/**
 * Initialization data for the @webds/heatmap extension.
 */
const plugin: JupyterFrontEndPlugin<void> = {
  id: '@webds/heatmap:plugin',
  autoStart: true,
  requires: [ILauncher, ILayoutRestorer],
  activate: async (app: JupyterFrontEnd, launcher: ILauncher, restorer: ILayoutRestorer) => {
    console.log('JupyterLab extension @webds/heatmap is activated!');

    let widget: MainAreaWidget;
    const {commands, shell} = app;
    const command: string = 'webds_heatmap:open';
    commands.addCommand(command, {
      label: 'ADC Data',
      caption: 'ADC Data',
      icon: (args: {[x: string]: any}) => {
        return args['isLauncher'] ? heatmapIcon : undefined;
      },
      execute: () => {
        if (!widget || widget.isDisposed) {
          const content = new HeatmapWidget();
          widget = new MainAreaWidget<HeatmapWidget>({content});
          widget.id = 'webds_heatmap_widget';
          widget.title.label = 'ADC Data';
          widget.title.icon = heatmapIcon;
          widget.title.closable = true;
        }

        if (!tracker.has(widget))
          tracker.add(widget);

        if (!widget.isAttached)
          shell.add(widget, 'main');

        shell.activateById(widget.id);
      }
    });

    launcher.add({command, args: {isLauncher: true}, category: 'WebDS - Exploration'});

    let tracker = new WidgetTracker<MainAreaWidget>({namespace: 'webds_heatmap'});
    restorer.restore(tracker, {command, name: () => 'webds_heatmap'});
  }
};

export default plugin;
