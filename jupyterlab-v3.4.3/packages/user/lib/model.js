// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
import { Signal } from '@lumino/signaling';
import { UUID } from '@lumino/coreutils';
import { USER } from './tokens';
import { getAnonymousUserName } from './utils';
/**
 * Default user implementation.
 */
export class User {
    /**
     * Constructor of the User class.
     */
    constructor() {
        this._isReady = false;
        this._ready = new Signal(this);
        this._changed = new Signal(this);
        this._fetchUser();
        this._isReady = true;
        this._ready.emit(true);
    }
    /**
     * User's unique identifier.
     */
    get username() {
        return this._username;
    }
    /**
     * User's full name.
     */
    get name() {
        return this._name;
    }
    /**
     * Shorter version of the name for displaying it on the UI.
     */
    get displayName() {
        return this._displayName;
    }
    /**
     * User's name initials.
     */
    get initials() {
        return this._initials;
    }
    /**
     * User's cursor color and icon color if avatar_url is undefined
     * (there is no image).
     */
    get color() {
        return this._color;
    }
    /**
     * Whether the user is anonymous or not.
     *
     * NOTE: Jupyter server doesn't handle user's identity so, by default every user
     * is anonymous unless a third-party extension provides the ICurrentUser token retrieving
     * the user identity from a third-party identity provider as GitHub, Google, etc.
     */
    get anonymous() {
        return this._anonymous;
    }
    /**
     * User's cursor position on the document.
     *
     * If undefined, the user is not on a document.
     */
    get cursor() {
        return this._cursor;
    }
    /**
     * Whether the user information is loaded or not.
     */
    get isReady() {
        return this._isReady;
    }
    /**
     * Signal emitted when the user's information is ready.
     */
    get ready() {
        return this._ready;
    }
    /**
     * Signal emitted when the user's information changes.
     */
    get changed() {
        return this._changed;
    }
    /**
     * Convenience method to modify the user as a JSON object.
     */
    fromJSON(user) {
        this._username = user.username;
        this._name = user.name;
        this._displayName = user.displayName;
        this._initials = user.initials;
        this._color = user.color;
        this._anonymous = user.anonymous;
        this._cursor = user.cursor;
        this._save();
    }
    /**
     * Convenience method to export the user as a JSON object.
     */
    toJSON() {
        return {
            username: this._username,
            name: this.name,
            displayName: this._displayName,
            initials: this._initials,
            color: this._color,
            anonymous: this._anonymous,
            cursor: this._cursor
        };
    }
    /**
     * Saves the user information to StateDB.
     */
    _save() {
        const { localStorage } = window;
        localStorage.setItem(USER, JSON.stringify(this.toJSON()));
        this._changed.emit();
    }
    /**
     * Retrieves the user information from StateDB, or initializes
     * the user as anonymous if doesn't exists.
     */
    _fetchUser() {
        // Read username, color and initials from URL
        const urlParams = new URLSearchParams(location.search);
        let name = urlParams.get('username') || '';
        let color = urlParams.get('usercolor') || '';
        let initials = urlParams.get('initials') || '';
        const { localStorage } = window;
        const data = localStorage.getItem(USER);
        if (data !== null) {
            const user = JSON.parse(data);
            this._username = user.username;
            this._name = name !== '' ? name : user.name;
            this._displayName = name !== '' ? name : user.displayName;
            this._initials = initials !== '' ? initials : user.initials;
            this._color = color !== '' ? '#' + color : user.color;
            this._anonymous = user.anonymous;
            this._cursor = user.cursor || undefined;
            if (name !== '' || color !== '') {
                this._save();
            }
        }
        else {
            // Get random values
            const anonymousName = getAnonymousUserName();
            this._username = UUID.uuid4();
            this._name = name !== '' ? name : 'Anonymous ' + anonymousName;
            this._displayName = this._name;
            this._initials =
                initials !== ''
                    ? initials
                    : `A${anonymousName.substring(0, 1).toLocaleUpperCase()}`;
            this._color = color !== '' ? '#' + color : Private.getRandomColor();
            this._anonymous = true;
            this._cursor = undefined;
            this._save();
        }
    }
}
/**
 * A namespace for module-private functionality.
 *
 * Note: We do not want to export this function
 * to move it to css variables in the Theme.
 */
var Private;
(function (Private) {
    /**
     * Predefined colors for users
     */
    const userColors = [
        'var(--jp-collaborator-color1)',
        'var(--jp-collaborator-color2)',
        'var(--jp-collaborator-color3)',
        'var(--jp-collaborator-color4)',
        'var(--jp-collaborator-color5)',
        'var(--jp-collaborator-color6)',
        'var(--jp-collaborator-color7)'
    ];
    /**
     * Get a random color from the list of colors.
     */
    Private.getRandomColor = () => userColors[Math.floor(Math.random() * userColors.length)];
})(Private || (Private = {}));
//# sourceMappingURL=model.js.map