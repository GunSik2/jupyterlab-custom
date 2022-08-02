import React from 'react';
/**
 * Collapse component property
 */
export interface ICollapseProps extends React.HTMLAttributes<HTMLDivElement> {
    /**
     * Whether the component is open or closed.
     *
     * @default false
     */
    isOpen?: boolean;
}
/**
 * Collapse component
 *
 * @param props Component properties
 * @returns Component
 */
export declare function Collapse(props: ICollapseProps): JSX.Element;
