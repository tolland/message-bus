// src/messaging/extensible_message_bus.ts
import { Message, MessageBusOptions, MessageHandler } from './types';
import { ContextDetector } from '@tolland/context-detector/src';
import { MESSAGE_BUS_CONFIG } from './message_bus_config';

/**
 *
 * possibly alternative to MessageBus type
 * export class MessageBus<TMessageTypeMap extends Record<AllMessageTypes, { request: any; response: any }>> {
 */
export class ExtensibleMessageBus<
    TMessageTypeMap extends Record<string, { request: any; response: any }>,
> {
    private static instance: ExtensibleMessageBus<any> | null = null;
    private readonly hash: string;
    private handlers: Map<string, Set<MessageHandler<any, any>>> = new Map();
    private options: MessageBusOptions = {};

    // static getInstance<
    //     M extends Record<
    //         string,
    //         {
    //             request: any;
    //             response: any;
    //         }
    //     >,
    // >(): ExtensibleMessageBus<T> {
    //     if (!window.__messagingApiInstance) {
    //         window.__messagingApiInstance = new ExtensibleMessageBus<T>();
    //     }
    //     return window.__messagingApiInstance as ExtensibleMessageBus<T>;
    // }

    static getInstance<
        T extends Record<string, { request: any; response: any }>,
    >(): ExtensibleMessageBus<T> {
        if (!ExtensibleMessageBus.instance) {
            ExtensibleMessageBus.instance = new ExtensibleMessageBus<T>();
        }
        return ExtensibleMessageBus.instance as ExtensibleMessageBus<T>;
    }

    constructor() {
        this.hash =
            Math.random().toString(36).substring(2, 9) +
            '-' +
            Math.random().toString(36).substring(2, 11);
        console.log(`ExtensibleMessageBus constructor ${this.hash}`);

        browser.runtime.onMessage.addListener(
            (
                message: Message<any, any>,
                sender: browser.runtime.MessageSender,
                _sendResponse: (response?: any) => void
            ) => {
                if (this.isMessageBusFormat(message)) {
                    const result = this.handleIncomingMessage(message, sender);
                    console.dir(result);
                    return result;
                }

                return false;
            }
        );
    }

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
    public publish<K extends keyof TMessageTypeMap & string>(
        message: Omit<
            Message<
                TMessageTypeMap[K]['request'],
                TMessageTypeMap[K]['response']
            >,
            'type'
        > & { type: K }
    ): Promise<TMessageTypeMap[K]['response']> {
        const enrichedMessage: Message<
            TMessageTypeMap[K]['request'],
            TMessageTypeMap[K]['response']
        > = {
            ...message,
            source: message.source || ContextDetector.getRequestContext(),
        };

        console.debug(
            `Publishing message: %O from ${this.hash} to ${enrichedMessage.target} with type ${enrichedMessage.type} and source ${enrichedMessage.source}`,
            enrichedMessage
        );

        if (ContextDetector.isBackgroundScript()) {
            return this.dispatchFromBackground(enrichedMessage);
        } else {
            return browser.runtime.sendMessage(enrichedMessage);
        }
    }

    private isMessageBusFormat(message: any): boolean {
        // Check if the message has the required structure for our message bus
        return Boolean(
            message &&
                typeof message === 'object' &&
                typeof message.type === 'string' &&
                message.type.length > 0 &&
                'payload' in message &&
                typeof message.target === 'string'
        );
    }

    private async handleIncomingMessage(
        message: Message<any, any>,
        sender: browser.runtime.MessageSender
    ): Promise<any> {
        // If we're in the background script, we might need to route messages
        if (ContextDetector.isBackgroundScript()) {
            // Route to specific target if specified
            if (
                message.target &&
                message.target !== 'background' &&
                message.target !== 'broadcast'
            ) {
                return this.routeMessage(message, sender);
            }

            // Broadcast if requested
            if (message.target === 'broadcast') {
                await this.broadcastMessage(message, sender);
            }
        }

        // Handle locally regardless of routing
        return this.triggerHandlers(message);
    }

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
    public subscribe<K extends keyof TMessageTypeMap & string>(
        type: K,
        handler: (
            message: Message<
                TMessageTypeMap[K]['request'],
                TMessageTypeMap[K]['response']
            >
        ) => Promise<TMessageTypeMap[K]['response'] | void>
    ): () => void {
        if (!this.handlers.has(type)) {
            this.handlers.set(type, new Set());
        }

        this.handlers.get(type)?.add(handler as MessageHandler<any, any>);

        // Return unsubscribe function
        return () => {
            this.handlers
                .get(type)
                ?.delete(handler as MessageHandler<any, any>);
        };
    }

    private async routeMessage(
        message: Message<any, any>,
        sender: browser.runtime.MessageSender
    ): Promise<any> {
        // Route to content scripts
        if (message.target === 'content') {
            const tabId = message.tabId || sender.tab?.id;
            if (tabId) {
                return browser.tabs.sendMessage(tabId, message);
            }
        }

        // For other contexts like sidebar/popup, they'll receive it through runtime messaging
        // as long as they're open and have registered handlers
        return undefined;
    }

    private async broadcastMessage(
        message: Message<any, any>,
        sender: browser.runtime.MessageSender
    ): Promise<void> {
        // Broadcast to all tabs if needed
        if (message.target === 'broadcast' || message.target === 'content') {
            const tabs = await browser.tabs.query({});
            for (const tab of tabs) {
                // Don't send back to originating tab
                if (tab.id !== sender.tab?.id) {
                    try {
                        await browser.tabs.sendMessage(tab.id!, message);
                    } catch (e) {
                        // Tab might not have content script loaded, ignore
                    }
                }
            }
        }
    }

    private triggerHandlers(message: Message<any, any>): any {
        const handlers = this.handlers.get(message.type);
        if (!handlers) return undefined;

        let result;
        // Call all handlers
        for (const handler of Array.from(handlers)) {
            const handlerResult = handler(message);
            // If a handler returns something, use that as the result
            if (handlerResult !== undefined) {
                result = handlerResult;
            }
        }

        // Using a global flags object is not ideal, consider refactoring this
        if (
            typeof MESSAGE_BUS_CONFIG !== 'undefined' &&
            MESSAGE_BUS_CONFIG.CONTENTMESSAGEHANDLERLOGGER
        ) {
            console.log(
                `Triggered ${handlers.size} handlers for message type ${message.type}`
            );
            console.dir(result);
        }

        return result;
    }

    private async dispatchFromBackground(
        message: Message<any, any>
    ): Promise<any> {
        console.log('dispatching from background');
        // If broadcasting or specific routing
        if (message.target === 'broadcast') {
            await this.broadcastMessage(message, { tab: { id: -1 } } as any);
            // Also trigger local handlers
            return this.triggerHandlers(message);
        } else if (message.target === 'content') {
            // If tabId is specified, send to that specific tab
            if (message.tabId) {
                console.log(`Sending message to tab ${message.tabId}`);
                return browser.tabs.sendMessage(message.tabId, message);
            }
            // If no tabId but target is content, this is an error
            else {
                throw new Error(
                    'Cannot route message to content script: No tabId specified'
                );
                // Alternative: broadcast to all tabs instead of throwing
                //return this.broadcastToAllContentScripts(message);
            }
        }
        // Handle locally
        else {
            return this.triggerHandlers(message);
        }
    }

    private async broadcastToAllContentScripts(
        message: Message<any, any>
    ): Promise<void> {
        const tabs = await browser.tabs.query({});
        for (const tab of tabs) {
            if (tab.id) {
                try {
                    await browser.tabs.sendMessage(tab.id, message);
                } catch (e) {
                    // Tab might not have content script loaded, ignore
                    console.debug(
                        `Failed to send message to tab ${tab.id}:`,
                        e
                    );
                }
            }
        }
    }
}
