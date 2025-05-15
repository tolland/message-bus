import { BaseMessageTypes, Message, MessageBusOptions, MessageHandler, MessageTypeMap } from './types';
import { ContextDetector } from '@tolland/context-detector/src';
import { MESSAGE_BUS_CONFIG } from './message_bus_config';

/**
 *
 */
export class MessageBus {
    private readonly hash: string;

    private handlers: Map<
        // @ts-ignore
        keyof MessageTypeMap & BaseMessageTypes,
        Set<MessageHandler<any, any>>
    > = new Map();
    private options: MessageBusOptions = {};

    static getInstance(): MessageBus {
        if (!window.__messagingApiInstance) {
            window.__messagingApiInstance = new MessageBus();
        }
        return window.__messagingApiInstance;
    }

    private constructor() {
        this.hash =
            Math.random().toString(36).substring(2, 9) +
            '-' +
            Math.random().toString(36).substring(2, 11);
        console.log(`MessagingApi constructor ${this.hash}`);

        browser.runtime.onMessage.addListener(
            (
                message: Message,
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

    // @ts-ignore
    public publish<K extends keyof MessageTypeMap & MessageType>(
        message: Omit<
            Message<
                MessageTypeMap[K]['request'],
                MessageTypeMap[K]['response']
            >,
            'type'
        > & { type: K }
    ): Promise<MessageTypeMap[K]['response']> {
        const enrichedMessage = { ...message };

        if (!enrichedMessage.source) {
            enrichedMessage.source = ContextDetector.getRequestContext();
        }

        //if (this.options.verbose) {
        console.debug(
            `Publishing message: %O from ${this.hash} to ${enrichedMessage.target} with type ${enrichedMessage.type} and source ${enrichedMessage.source}`,
            enrichedMessage
        );
        //}

        if (ContextDetector.isBackgroundScript()) {
            return this.dispatchFromBackground(enrichedMessage);
        }
        // If we're in a content script, sidebar, or popup
        else {
            return browser.runtime.sendMessage(message);
        }
    }

    private isMessageBusFormat(message: any): boolean {
        return (
            message &&
            typeof message === 'object' &&
            'type' in message &&
            'target' in message
        );
    }

    private async handleIncomingMessage(
        message: Message,
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

    // @ts-ignore
    public subscribe<K extends keyof MessageTypeMap & MessageType>(
        type: K,
        handler: (
            message: Message<
                MessageTypeMap[K]['request'],
                MessageTypeMap[K]['response']
            >
        ) => Promise<MessageTypeMap[K]['response'] | void>
    ): () => void {
        if (!this.handlers.has(type)) {
            this.handlers.set(type, new Set());
        }

        this.handlers.get(type)?.add(handler);

        // Return unsubscribe function
        return () => {
            this.handlers.get(type)?.delete(handler);
        };
    }

    private async routeMessage(
        message: Message,
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
        message: Message,
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

    private triggerHandlers(message: Message): any {
        // @ts-ignore
        const handlers = this.handlers.get(
            // @ts-ignore
            message.type as keyof MessageTypeMap & MessageType
        );
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
        MESSAGE_BUS_CONFIG.CONTENTMESSAGEHANDLERLOGGER &&
            console.log(
                `Triggered ${handlers.size} handlers for message type ${message.type}`
            );
        MESSAGE_BUS_CONFIG.CONTENTMESSAGEHANDLERLOGGER && console.dir(result);
        return result;
    }

    private async dispatchFromBackground(message: Message): Promise<any> {
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
        message: Message
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

// export const messageBus = MessageBus.getInstance();