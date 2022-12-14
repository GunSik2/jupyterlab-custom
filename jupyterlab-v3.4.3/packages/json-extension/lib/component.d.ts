import { ITranslator } from '@jupyterlab/translation';
import { JSONObject, JSONValue } from '@lumino/coreutils';
import * as React from 'react';
/**
 * The properties for the JSON tree component.
 */
export interface IProps {
    data: NonNullable<JSONValue>;
    metadata?: JSONObject;
    /**
     * The application language translator.
     */
    translator?: ITranslator;
}
/**
 * The state of the JSON tree component.
 */
export interface IState {
    filter?: string;
    value: string;
}
/**
 * A component that renders JSON data as a collapsible tree.
 */
export declare class Component extends React.Component<IProps, IState> {
    state: {
        filter: string;
        value: string;
    };
    timer: number;
    handleChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
    render(): JSX.Element;
}
