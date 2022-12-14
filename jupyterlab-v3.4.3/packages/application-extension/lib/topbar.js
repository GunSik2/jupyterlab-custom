import { createToolbarFactory, IToolbarWidgetRegistry, setToolbar } from '@jupyterlab/apputils';
import { ISettingRegistry } from '@jupyterlab/settingregistry';
import { ITranslator, nullTranslator } from '@jupyterlab/translation';
import { Toolbar } from '@jupyterlab/ui-components';
const TOPBAR_FACTORY = 'TopBar';
/**
 * A plugin adding a toolbar to the top area.
 */
export const topbar = {
    id: '@jupyterlab/application-extension:top-bar',
    autoStart: true,
    requires: [ISettingRegistry, IToolbarWidgetRegistry],
    optional: [ITranslator],
    activate: (app, settingRegistry, toolbarRegistry, translator) => {
        const toolbar = new Toolbar();
        toolbar.id = 'jp-top-bar';
        // Set toolbar
        setToolbar(toolbar, createToolbarFactory(toolbarRegistry, settingRegistry, TOPBAR_FACTORY, topbar.id, translator !== null && translator !== void 0 ? translator : nullTranslator), toolbar);
        app.shell.add(toolbar, 'top', { rank: 900 });
    }
};
//# sourceMappingURL=topbar.js.map