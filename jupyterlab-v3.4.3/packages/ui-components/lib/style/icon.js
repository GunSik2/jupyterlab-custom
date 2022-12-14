// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
import { style as typestyleClass } from 'typestyle/lib';
export var LabIconStyle;
(function (LabIconStyle) {
    /**
     * The builtin stylesheets
     */
    const builtinSheets = {
        breadCrumb: {
            container: {
                $nest: {
                    // `&` will be substituted for the generated classname (interpolation)
                    '&:first-child svg': {
                        bottom: '1px',
                        marginLeft: '0px',
                        position: 'relative'
                    },
                    '&:hover': {
                        backgroundColor: 'var(--jp-layout-color2)'
                    },
                    ['.jp-mod-dropTarget&']: {
                        backgroundColor: 'var(--jp-brand-color2)',
                        opacity: 0.7
                    }
                }
            },
            element: {
                borderRadius: 'var(--jp-border-radius)',
                cursor: 'pointer',
                margin: '0px 2px',
                padding: '0px 2px',
                height: '16px',
                width: '16px',
                verticalAlign: 'middle'
            }
        },
        commandPaletteHeader: {
            container: {
                height: '14px',
                margin: '0 14px 0 auto'
            },
            element: {
                height: '14px',
                width: '14px'
            },
            options: {
                elementPosition: 'center'
            }
        },
        commandPaletteItem: {
            element: {
                height: '16px',
                width: '16px'
            },
            options: {
                elementPosition: 'center'
            }
        },
        launcherCard: {
            container: {
                height: '52px',
                width: '52px'
            },
            element: {
                height: '52px',
                width: '52px'
            },
            options: {
                elementPosition: 'center'
            }
        },
        launcherSection: {
            container: {
                boxSizing: 'border-box',
                marginRight: '12px',
                height: '32px',
                width: '32px'
            },
            element: {
                height: '32px',
                width: '32px'
            },
            options: {
                elementPosition: 'center'
            }
        },
        listing: {
            container: {
                flex: '0 0 20px',
                marginRight: '4px',
                position: 'relative'
            },
            element: {
                height: '16px',
                width: '16px'
            },
            options: {
                elementPosition: 'center'
            }
        },
        listingHeaderItem: {
            container: {
                display: 'inline',
                height: '16px',
                width: '16px'
            },
            element: {
                height: 'auto',
                margin: '-2px 0 0 0',
                width: '20px'
            },
            options: {
                elementPosition: 'center'
            }
        },
        mainAreaTab: {
            container: {
                $nest: {
                    '.lm-DockPanel-tabBar &': {
                        marginRight: '4px'
                    },
                    '#tab-manager &': {
                        marginRight: '2px',
                        position: 'relative'
                    }
                }
            },
            element: {
                $nest: {
                    '.lm-DockPanel-tabBar &': {
                        height: '14px',
                        width: '14px'
                    },
                    '#tab-manager &': {
                        height: '16px',
                        width: '16px'
                    }
                }
            },
            options: {
                elementPosition: 'center'
            }
        },
        menuItem: {
            container: {
                display: 'inline-block',
                verticalAlign: 'middle'
            },
            element: {
                height: '16px',
                width: '16px'
            },
            options: {
                elementPosition: 'center'
            }
        },
        runningItem: {
            container: {
                margin: '0px 4px 0px 4px'
            },
            element: {
                height: '16px',
                width: '16px'
            },
            options: {
                elementPosition: 'center'
            }
        },
        select: {
            container: {
                pointerEvents: 'none'
            },
            element: {
                position: 'absolute',
                height: 'auto',
                width: '16px'
            }
        },
        settingsEditor: {
            container: {
                display: 'flex',
                flex: '0 0 20px',
                margin: '0 3px 0 0',
                position: 'relative',
                height: '20px',
                width: '20px'
            },
            element: {
                height: '16px',
                width: '16px'
            },
            options: {
                elementPosition: 'center'
            }
        },
        sideBar: {
            container: {
                // `&` will be substituted for the generated classname (interpolation)
                $nest: {
                    // left sidebar tab divs
                    '.jp-SideBar.jp-mod-left .lm-TabBar-tab &': {
                        transform: 'rotate(90deg)'
                    },
                    // left sidebar currently selected tab div
                    '.jp-SideBar.jp-mod-left .lm-TabBar-tab.lm-mod-current &': {
                        transform: 'rotate(90deg)\n' +
                            '    translate(\n' +
                            '      calc(-0.5 * var(--jp-border-width)),\n' +
                            '      calc(-0.5 * var(--jp-border-width))\n' +
                            '    )'
                    },
                    // right sidebar tab divs
                    '.jp-SideBar.jp-mod-right .lm-TabBar-tab &': {
                        transform: 'rotate(-90deg)'
                    },
                    // right sidebar currently selected tab div
                    '.jp-SideBar.jp-mod-right .lm-TabBar-tab.lm-mod-current &': {
                        transform: 'rotate(-90deg)\n' +
                            '    translate(\n' +
                            '      calc(0.5 * var(--jp-border-width)),\n' +
                            '      calc(-0.5 * var(--jp-border-width))\n' +
                            '    )'
                    }
                }
            },
            element: {
                height: 'auto',
                width: '20px'
            },
            options: {
                elementPosition: 'center'
            }
        },
        splash: {
            container: {
                animation: '0.3s fade-in linear forwards',
                height: '100%',
                width: '100%',
                zIndex: 1
            },
            element: {
                // width no height
                width: '100px'
            },
            options: {
                elementPosition: 'center'
            }
        },
        statusBar: {
            element: {
                left: '0px',
                top: '0px',
                height: '18px',
                width: '20px',
                position: 'relative'
            }
        },
        toolbarButton: {
            container: {
                display: 'inline-block',
                verticalAlign: 'middle'
            },
            element: {
                height: '16px',
                width: '16px'
            },
            options: {
                elementPosition: 'center'
            }
        }
    };
    function _elementPositionFactory(extra) {
        return {
            container: {
                alignItems: 'center',
                display: 'flex'
            },
            element: Object.assign({ display: 'block' }, extra)
        };
    }
    /**
     * Styles to help with positioning
     */
    const positionSheets = {
        center: _elementPositionFactory({ margin: '0 auto', width: '100%' }),
        top: _elementPositionFactory({ margin: '0 0 auto 0' }),
        right: _elementPositionFactory({ margin: '0 0 0 auto' }),
        bottom: _elementPositionFactory({ margin: 'auto 0 0 0' }),
        left: _elementPositionFactory({ margin: '0 auto 0 0' }),
        'top right': _elementPositionFactory({ margin: '0 0 auto auto' }),
        'bottom right': _elementPositionFactory({ margin: 'auto 0 0 auto' }),
        'bottom left': _elementPositionFactory({ margin: 'auto auto 0 0' }),
        'top left': _elementPositionFactory({ margin: '0 auto 0 auto' })
    };
    function _elementSizeFactory(size) {
        return {
            element: {
                height: size,
                width: size
            }
        };
    }
    /**
     * sheets that establish some default sizes
     */
    const sizeSheets = {
        small: _elementSizeFactory('14px'),
        normal: _elementSizeFactory('16px'),
        large: _elementSizeFactory('20px'),
        xlarge: _elementSizeFactory('24px')
    };
    /**
     * Merge two or more icon sheets into a single "pure"
     * icon style (ie collections of CSS props only)
     */
    function mergeSheets(sheets) {
        return {
            container: Object.assign({}, ...sheets.map(s => s.container)),
            element: Object.assign({}, ...sheets.map(s => s.element))
        };
    }
    /**
     * Resolve one or more stylesheets that may just be a string naming
     * one of the builtin stylesheets to an array of proper ISheet objects
     */
    function resolveSheet(stylesheet) {
        if (!stylesheet) {
            return [];
        }
        if (!Array.isArray(stylesheet)) {
            // wrap in array
            stylesheet = [stylesheet];
        }
        return stylesheet.map(k => (typeof k === 'string' ? builtinSheets[k] : k));
    }
    /**
     * Resolve and merge multiple icon stylesheets
     */
    function applySheetOptions(sheets) {
        const options = Object.assign({}, ...sheets.map(s => s.options));
        if (options.elementPosition) {
            sheets.unshift(positionSheets[options.elementPosition]);
        }
        if (options.elementSize) {
            sheets.unshift(sizeSheets[options.elementSize]);
        }
        return mergeSheets(sheets);
    }
    /**
     * Resolve a pure icon stylesheet into a typestyle class
     */
    function resolveStyleClass(stylesheet) {
        var _a;
        return typestyleClass(Object.assign(Object.assign({}, stylesheet.container), { $nest: Object.assign(Object.assign({}, (_a = stylesheet.container) === null || _a === void 0 ? void 0 : _a.$nest), { ['svg']: stylesheet.element }) }));
    }
    // cache style classes for builtin stylesheets
    const _styleClassCache = new Map();
    /**
     * Get a typestyle class, given a set of icon styling props
     */
    function styleClass(props) {
        if (!props || Object.keys(props).length === 0) {
            // props is empty
            return '';
        }
        let { elementPosition, elementSize, stylesheet, kind, justify } = props, elementCSS = __rest(props, ["elementPosition", "elementSize", "stylesheet", "kind", "justify"]);
        // DEPRECATED: alias kind => stylesheet
        if (!stylesheet) {
            stylesheet = kind;
        }
        // DEPRECATED: alias justify => elementPosition
        if (!elementPosition) {
            elementPosition = justify;
        }
        // add option args with defined values to overrides
        const options = Object.assign(Object.assign({}, (elementPosition && { elementPosition })), (elementSize && { elementSize }));
        // try to look up the style class in the cache
        const cacheable = typeof stylesheet === 'string' && Object.keys(elementCSS).length === 0;
        const cacheKey = cacheable
            ? [stylesheet, elementPosition, elementSize].join(',')
            : '';
        if (cacheable && _styleClassCache.has(cacheKey)) {
            return _styleClassCache.get(cacheKey);
        }
        // resolve kind to an array of sheets, then stick overrides on the end
        const sheets = resolveSheet(stylesheet);
        sheets.push({ element: elementCSS, options });
        // apply style options/merge sheets, then convert to typestyle class
        const cls = resolveStyleClass(applySheetOptions(sheets));
        if (cacheable) {
            // store in cache for later reuse
            _styleClassCache.set(cacheKey, cls);
        }
        return cls;
    }
    LabIconStyle.styleClass = styleClass;
})(LabIconStyle || (LabIconStyle = {}));
//# sourceMappingURL=icon.js.map