/**
 * Message types for the messaging system.
 *
 *
 *
 */
import { JsonObject } from '@tolland/types-jsonobjects/src';
import { RequestContext } from '@tolland/context-detector/src/types';



export const BaseMessageTypes = {
    PING: 'PING',
    PONG: 'PONG',
    CONNECTED: 'CONNECTED',
    DISCONNECTED: 'DISCONNECTED',
    UPDATE: 'UPDATE',
} as const;

// Create a type from the object values
export type BaseMessageType = typeof BaseMessageTypes[keyof typeof BaseMessageTypes];

let c: JsonObject;

export interface BaseMessageTypeMap {
    [BaseMessageTypes.PING]: {
        request: JsonObject;
        response: void;
    };
    [BaseMessageTypes.PONG]: {
        request: JsonObject;
        response: void;
    };
    [BaseMessageTypes.CONNECTED]: {
        request: { clientId: string };
        response: void;
    };
    [BaseMessageTypes.DISCONNECTED]: {
        request: { clientId: string };
        response: void;
    };
    [BaseMessageTypes.UPDATE]: {
        request: { key: string; data: any };
        response: void;
    };
}



// Message type registry
export interface MessageTypeMap {
    [BaseMessageTypes.PING]: {
        request: JsonObject;
        response: void;
    };
    [BaseMessageTypes.PONG]: {
        request: JsonObject;
        response: void;
    };
    // Define other message types similarly
}

export type MessageTarget =
    | 'content'
    | 'background'
    | 'sidebar'
    | 'popup'
    | 'broadcast';

/**
 * Generic message interface that can represent any message type.
 * Type parameters allow for strong typing of payload and response.
 *
 * @template T The type of the payload
 * @template R The type of the expected response
 */
export interface Message<T = any, R = any> {
    /** Identifies the message type, must match a key in the MessageTypeMap */
    type: string;

    /** The message payload, structure depends on the message type */
    payload: T;

    /** Where the message originated from (background, content, etc.) */
    source?: RequestContext;

    /** Where the message should be delivered to */
    target?: MessageTarget;

    /** For targeting specific tabs when target is 'content' */
    tabId?: number;

    /** Type information for the expected response (used for TypeScript) */
    __responseType?: R;
}

export type MessageBusOptions = {
    verbose?: boolean;
};



export type MessageHandler<T, R> = (
    message: Message<T, R>
) => Promise<R | void>;

// export type MessageHandler<K extends keyof MessageTypeMap & MessageType> =
//     (message: TypedMessage<MessageTypeMap[K]['request'], MessageTypeMap[K]['response']>) =>
//         Promise<MessageTypeMap[K]['response'] | void>;