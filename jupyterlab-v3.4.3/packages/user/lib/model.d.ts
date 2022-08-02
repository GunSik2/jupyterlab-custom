import { ISignal } from '@lumino/signaling';
import { ICurrentUser, IUser } from './tokens';
/**
 * Default user implementation.
 */
export declare class User implements ICurrentUser {
    private _username;
    private _name;
    private _displayName;
    private _initials;
    private _color;
    private _anonymous;
    private _cursor?;
    private _isReady;
    private _ready;
    private _changed;
    /**
     * Constructor of the User class.
     */
    constructor();
    /**
     * User's unique identifier.
     */
    get username(): string;
    /**
     * User's full name.
     */
    get name(): string;
    /**
     * Shorter version of the name for displaying it on the UI.
     */
    get displayName(): string;
    /**
     * User's name initials.
     */
    get initials(): string;
    /**
     * User's cursor color and icon color if avatar_url is undefined
     * (there is no image).
     */
    get color(): string;
    /**
     * Whether the user is anonymous or not.
     *
     * NOTE: Jupyter server doesn't handle user's identity so, by default every user
     * is anonymous unless a third-party extension provides the ICurrentUser token retrieving
     * the user identity from a third-party identity provider as GitHub, Google, etc.
     */
    get anonymous(): boolean;
    /**
     * User's cursor position on the document.
     *
     * If undefined, the user is not on a document.
     */
    get cursor(): IUser.Cursor | undefined;
    /**
     * Whether the user information is loaded or not.
     */
    get isReady(): boolean;
    /**
     * Signal emitted when the user's information is ready.
     */
    get ready(): ISignal<ICurrentUser, boolean>;
    /**
     * Signal emitted when the user's information changes.
     */
    get changed(): ISignal<ICurrentUser, void>;
    /**
     * Convenience method to modify the user as a JSON object.
     */
    fromJSON(user: IUser.User): void;
    /**
     * Convenience method to export the user as a JSON object.
     */
    toJSON(): IUser.User;
    /**
     * Saves the user information to StateDB.
     */
    private _save;
    /**
     * Retrieves the user information from StateDB, or initializes
     * the user as anonymous if doesn't exists.
     */
    private _fetchUser;
}
