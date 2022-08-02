/// <reference types="jest" />
import { ISessionContext, SessionContext } from '@jupyterlab/apputils';
import { Context } from '@jupyterlab/docregistry';
import { Contents, Kernel, KernelMessage, KernelSpec, ServiceManager, Session } from '@jupyterlab/services';
import { AttachedProperty } from '@lumino/properties';
export declare const DEFAULT_NAME = "python3";
export declare const KERNELSPECS: {
    [key: string]: KernelSpec.ISpecModel;
};
export declare const KERNEL_MODELS: Kernel.IModel[];
export declare const NOTEBOOK_PATHS: {
    [kernelName: string]: string[];
};
/**
 * Forceably change the status of a session context.
 * An iopub message is emitted for the change.
 *
 * @param sessionContext The session context of interest.
 * @param newStatus The new kernel status.
 */
export declare function updateKernelStatus(sessionContext: ISessionContext, newStatus: KernelMessage.Status): void;
/**
 * Emit an iopub message on a session context.
 *
 * @param sessionContext The session context
 * @param msg Message created with `KernelMessage.createMessage`
 */
export declare function emitIopubMessage(context: ISessionContext, msg: KernelMessage.IIOPubMessage): void;
/**
 * Create a session context given a partial session model.
 *
 * @param model The session model to use.
 */
export declare function createSimpleSessionContext(model?: Private.RecursivePartial<Session.IModel>): ISessionContext;
/**
 * Clone a kernel connection.
 */
export declare function cloneKernel(kernel: Kernel.IKernelConnection): Kernel.IKernelConnection;
/**
 * A mock kernel object.
 *
 * @param model The model of the kernel
 */
export declare const KernelMock: jest.Mock<Kernel.IKernelConnection, [Private.RecursivePartial<Kernel.IKernelConnection.IOptions>]>;
/**
 * A mock session connection.
 *
 * @param options Addition session options to use
 * @param model A session model to use
 */
export declare const SessionConnectionMock: jest.Mock<Session.ISessionConnection, [Private.RecursivePartial<Session.ISessionConnection.IOptions>, Kernel.IKernelConnection | null]>;
/**
 * A mock session context.
 *
 * @param session The session connection object to use
 */
export declare const SessionContextMock: jest.Mock<ISessionContext, [Partial<SessionContext.IOptions>, Session.ISessionConnection | null]>;
/**
 * A mock contents manager.
 */
export declare const ContentsManagerMock: jest.Mock<Contents.IManager, []>;
/**
 * A mock sessions manager.
 */
export declare const SessionManagerMock: jest.Mock<Session.IManager, []>;
/**
 * A mock kernel specs manager
 */
export declare const KernelSpecManagerMock: jest.Mock<KernelSpec.IManager, []>;
/**
 * A mock service manager.
 */
export declare const ServiceManagerMock: jest.Mock<ServiceManager.IManager, []>;
/**
 * A mock kernel shell future.
 */
export declare const MockShellFuture: jest.Mock<Kernel.IShellFuture<KernelMessage.IShellMessage<KernelMessage.ShellMessageType>, KernelMessage.IShellMessage<KernelMessage.ShellMessageType>>, [KernelMessage.IShellMessage<KernelMessage.ShellMessageType>]>;
/**
 * Create a context for a file.
 */
export declare function createFileContext(startKernel?: boolean, manager?: ServiceManager.IManager): Promise<Context>;
/**
 * A namespace for module private data.
 */
declare namespace Private {
    function flattenArray<T>(arr: T[][]): T[];
    type RecursivePartial<T> = {
        [P in keyof T]?: RecursivePartial<T[P]>;
    };
    function createFile(options?: Contents.ICreateOptions): Contents.IModel;
    function fixSlash(path: string): string;
    function makeResponseError<T>(status: number): Promise<T>;
    function cloneKernel(options: RecursivePartial<Kernel.IKernelConnection.IOptions>): Kernel.IKernelConnection;
    function kernelSpecForKernelName(name: string): KernelSpec.ISpecModel;
    function getInfo(name: string): KernelMessage.IInfoReply;
    function changeKernel(kernel: Kernel.IKernelConnection, partialModel: Partial<Kernel.IModel>): Promise<Kernel.IModel>;
    const RUNNING_KERNELS: Kernel.IKernelConnection[];
    const lastMessageProperty: AttachedProperty<Kernel.IKernelConnection, string>;
}
export {};
