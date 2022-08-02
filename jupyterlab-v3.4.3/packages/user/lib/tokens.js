// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
import { Token } from '@lumino/coreutils';
/**
 * An ID to track the user on StateDB.
 */
export const USER = '@jupyterlab/user:userDB';
/**
 * @experimental
 * @alpha
 *
 * The user token.
 *
 * NOTE: Requirer this token in your extension to access the
 * current connected user information.
 */
export const ICurrentUser = new Token('@jupyterlab/user:ICurrentUser');
/**
 * The user menu token.
 *
 * NOTE: Require this token in your extension to access the user menu
 * (top-right menu in JupyterLab's interface).
 */
export const IUserMenu = new Token('@jupyterlab/user:IUserMenu');
//# sourceMappingURL=tokens.js.map