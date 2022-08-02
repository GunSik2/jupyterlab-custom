import React from 'react';
import { LabIcon } from '../icon';
/**
 * InputGroup component properties
 */
export interface IInputGroupProps extends React.InputHTMLAttributes<HTMLInputElement> {
    /**
     * Right icon adornment
     */
    rightIcon?: string | LabIcon;
}
/**
 * InputGroup component
 *
 * @param props Component properties
 * @returns Component
 */
export declare function InputGroup(props: IInputGroupProps): JSX.Element;
