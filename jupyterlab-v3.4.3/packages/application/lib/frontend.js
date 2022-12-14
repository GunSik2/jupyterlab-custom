// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
import { CommandLinker } from '@jupyterlab/apputils';
import { DocumentRegistry } from '@jupyterlab/docregistry';
import { ServiceManager } from '@jupyterlab/services';
import { ContextMenuSvg } from '@jupyterlab/ui-components';
import { Application } from '@lumino/application';
import { Token } from '@lumino/coreutils';
import { Signal } from '@lumino/signaling';
/**
 * The base Jupyter front-end application class.
 *
 * @typeparam `T` - The `shell` type. Defaults to `JupyterFrontEnd.IShell`.
 *
 * @typeparam `U` - The type for supported format names. Defaults to `string`.
 *
 * #### Notes
 * This type is useful as a generic application against which front-end plugins
 * can be authored. It inherits from the Lumino `Application`.
 */
export class JupyterFrontEnd extends Application {
    /**
     * Construct a new JupyterFrontEnd object.
     */
    constructor(options) {
        super(options);
        this._formatChanged = new Signal(this);
        // render context menu/submenus with inline svg icon tweaks
        this.contextMenu = new ContextMenuSvg({
            commands: this.commands,
            renderer: options.contextMenuRenderer,
            groupByTarget: false,
            sortBySelector: false
        });
        // The default restored promise if one does not exist in the options.
        const restored = new Promise(resolve => {
            requestAnimationFrame(() => {
                resolve();
            });
        });
        this.commandLinker =
            options.commandLinker || new CommandLinker({ commands: this.commands });
        this.docRegistry = options.docRegistry || new DocumentRegistry();
        this.restored =
            options.restored ||
                this.started.then(() => restored).catch(() => restored);
        this.serviceManager = options.serviceManager || new ServiceManager();
    }
    /**
     * The application form factor, e.g., `desktop` or `mobile`.
     */
    get format() {
        return this._format;
    }
    set format(format) {
        if (this._format !== format) {
            this._format = format;
            document.body.dataset['format'] = format;
            this._formatChanged.emit(format);
        }
    }
    /**
     * A signal that emits when the application form factor changes.
     */
    get formatChanged() {
        return this._formatChanged;
    }
    /**
     * Walks up the DOM hierarchy of the target of the active `contextmenu`
     * event, testing each HTMLElement ancestor for a user-supplied function. This can
     * be used to find an HTMLElement on which to operate, given a context menu click.
     *
     * @param fn - a function that takes an `HTMLElement` and returns a
     *   boolean for whether it is the element the requester is seeking.
     *
     * @returns an HTMLElement or undefined, if none is found.
     */
    contextMenuHitTest(fn) {
        if (!this._contextMenuEvent ||
            !(this._contextMenuEvent.target instanceof Node)) {
            return undefined;
        }
        let node = this._contextMenuEvent.target;
        do {
            if (node instanceof HTMLElement && fn(node)) {
                return node;
            }
            node = node.parentNode;
        } while (node && node.parentNode && node !== node.parentNode);
        return undefined;
        // TODO: we should be able to use .composedPath() to simplify this function
        // down to something like the below, but it seems like composedPath is
        // sometimes returning an empty list.
        /*
        if (this._contextMenuEvent) {
          this._contextMenuEvent
            .composedPath()
            .filter(x => x instanceof HTMLElement)
            .find(test);
        }
        return undefined;
        */
    }
    /**
     * A method invoked on a document `'contextmenu'` event.
     */
    evtContextMenu(event) {
        this._contextMenuEvent = event;
        if (event.shiftKey ||
            Private.suppressContextMenu(event.target)) {
            return;
        }
        const opened = this.contextMenu.open(event);
        if (opened) {
            const items = this.contextMenu.menu.items;
            // If only the context menu information will be shown,
            // with no real commands, close the context menu and
            // allow the native one to open.
            if (items.length === 1 &&
                items[0].command === JupyterFrontEndContextMenu.contextMenu) {
                this.contextMenu.menu.close();
                return;
            }
            // Stop propagation and allow the application context menu to show.
            event.preventDefault();
            event.stopPropagation();
        }
    }
}
/**
 * The namespace for `JupyterFrontEnd` class statics.
 */
(function (JupyterFrontEnd) {
    /**
     * Is JupyterLab in document mode?
     *
     * @param path - Full URL of JupyterLab
     * @param paths - The current IPaths object hydrated from PageConfig.
     */
    function inDocMode(path, paths) {
        const docPattern = new RegExp(`^${paths.urls.doc}`);
        const match = path.match(docPattern);
        if (match) {
            return true;
        }
        else {
            return false;
        }
    }
    JupyterFrontEnd.inDocMode = inDocMode;
    /**
     * The application paths dictionary token.
     */
    JupyterFrontEnd.IPaths = new Token('@jupyterlab/application:IPaths');
    /**
     * The application tree resolver token.
     *
     * #### Notes
     * Not all Jupyter front-end applications will have a tree resolver
     * implemented on the client-side. This token should not be required as a
     * dependency if it is possible to make it an optional dependency.
     */
    JupyterFrontEnd.ITreeResolver = new Token('@jupyterlab/application:ITreeResolver');
})(JupyterFrontEnd || (JupyterFrontEnd = {}));
/**
 * A namespace for module-private functionality.
 */
var Private;
(function (Private) {
    /**
     * Returns whether the element is itself, or a child of, an element with the `jp-suppress-context-menu` data attribute.
     */
    function suppressContextMenu(element) {
        return element.closest('[data-jp-suppress-context-menu]') !== null;
    }
    Private.suppressContextMenu = suppressContextMenu;
})(Private || (Private = {}));
/**
 * A namespace for the context menu override.
 */
export var JupyterFrontEndContextMenu;
(function (JupyterFrontEndContextMenu) {
    /**
     * An id for a private context-menu-info ersatz command.
     */
    JupyterFrontEndContextMenu.contextMenu = '__internal:context-menu-info';
})(JupyterFrontEndContextMenu || (JupyterFrontEndContextMenu = {}));
//# sourceMappingURL=frontend.js.map