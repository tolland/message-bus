import { Message } from './types';
/**
 *
 * possibly alternative to MessageBus type
 * export class MessageBus<TMessageTypeMap extends Record<AllMessageTypes, { request: any; response: any }>> {
 */
export declare class ExtensibleMessageBus<TMessageTypeMap extends Record<string, {
    request: any;
    response: any;
}>> {
    private static instance;
    private readonly hash;
    private handlers;
    private options;
    static getInstance<T extends Record<string, {
        request: any;
        response: any;
    }>>(): ExtensibleMessageBus<T>;
    constructor();
    /**
     * Publishes a message to the message bus.
     *
     * This method uses a complex type signature to enforce type safety:
     * - The generic parameter K must be a valid message type key
     * - The message payload must match the expected request type for that message
     * - The return type is guaranteed to match the expected response type
     * - The 'type' field must exactly match the message type (K)
     *
     * This is more type-safe than simpler alternatives like:
     * `publish(type: K, payload: TMessageTypeMap[K]['request'])`
     * because it prevents mismatches between the message type and its payload structure.
     *
     * @param message The message to publish with payload matching the required structure for its type
     * @returns A promise that resolves to the response
     */
    publish<K extends keyof TMessageTypeMap & string>(message: Omit<Message<TMessageTypeMap[K]['request'], TMessageTypeMap[K]['response']>, 'type'> & {
        type: K;
    }): Promise<TMessageTypeMap[K]['response']>;
    private isMessageBusFormat;
    private handleIncomingMessage;
    /**
     * Subscribes to a specific message type.
     *
     * The handler receives strongly-typed messages with payload and response types
     * that match the expected structure for the given message type.
     *
     * @param type The message type to subscribe to
     * @param handler A function that handles messages of the specified type
     * @returns A function that can be called to unsubscribe
     */
    subscribe<K extends keyof TMessageTypeMap & string>(type: K, handler: (message: Message<TMessageTypeMap[K]['request'], TMessageTypeMap[K]['response']>) => Promise<TMessageTypeMap[K]['response'] | void>): () => void;
    private routeMessage;
    private broadcastMessage;
    private triggerHandlers;
    private dispatchFromBackground;
    private broadcastToAllContentScripts;
}
//# sourceMappingURL=extensible_message_bus.d.ts.map