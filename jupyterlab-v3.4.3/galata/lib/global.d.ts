import { JupyterFrontEnd } from '@jupyterlab/application';
import { IGalataInpage } from './inpage/tokens';
declare global {
    interface Window {
        /**
         * Access JupyterLab Application object
         *
         * @deprecated since v4
         * Please use window.jupyterapp to access the Jupyter Application
         */
        jupyterlab?: JupyterFrontEnd;
        /**
         * Access Jupyter Application object
         */
        jupyterapp: JupyterFrontEnd;
        /**
         * Access to Galata In-Page helpers
         *
         * Those helpers are injected when navigating to JupyterLab page
         */
        galataip: IGalataInpage;
    }
}
