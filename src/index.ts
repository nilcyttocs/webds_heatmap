import {
  ILayoutRestorer,
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from "@jupyterlab/application";

import { WidgetTracker } from "@jupyterlab/apputils";

import { ILauncher } from "@jupyterlab/launcher";

import { WebDSService, WebDSWidget } from "@webds/service";

import { heatmapIcon } from "./icons";

import { HeatmapWidget } from "./widget_container";

namespace Attributes {
  export const command = "webds_heatmap:open";
  export const id = "webds_heatmap_widget";
  export const label = "ADC Data";
  export const caption = "ADC Data";
  export const category = "Touch - Assessment";
  export const rank = 30;
}

/**
 * Initialization data for the @webds/heatmap extension.
 */
const plugin: JupyterFrontEndPlugin<void> = {
  id: "@webds/heatmap:plugin",
  autoStart: true,
  requires: [ILauncher, ILayoutRestorer, WebDSService],
  activate: async (
    app: JupyterFrontEnd,
    launcher: ILauncher,
    restorer: ILayoutRestorer,
    service: WebDSService
  ) => {
    console.log("JupyterLab extension @webds/heatmap is activated!");

    await service.initialized;

    let widget: WebDSWidget;
    const { commands, shell } = app;
    const command = Attributes.command;
    commands.addCommand(command, {
      label: Attributes.label,
      caption: Attributes.caption,
      icon: (args: { [x: string]: any }) => {
        return args["isLauncher"] ? heatmapIcon : undefined;
      },
      execute: () => {
        if (!widget || widget.isDisposed) {
          const content = new HeatmapWidget(Attributes.id, service);
          widget = new WebDSWidget<HeatmapWidget>({ content });
          widget.id = Attributes.id;
          widget.title.label = Attributes.label;
          widget.title.icon = heatmapIcon;
          widget.title.closable = true;
        }

        if (!tracker.has(widget)) tracker.add(widget);

        if (!widget.isAttached) shell.add(widget, "main");

        shell.activateById(widget.id);

        widget.setShadows();
      }
    });

    launcher.add({
      command,
      args: { isLauncher: true },
      category: Attributes.category,
      rank: Attributes.rank
    });

    let tracker = new WidgetTracker<WebDSWidget>({
      namespace: Attributes.id
    });
    restorer.restore(tracker, { command, name: () => Attributes.id });
  }
};

export default plugin;
