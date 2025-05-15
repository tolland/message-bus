import { ContextDetector } from '@tolland/context-detector/src';
import { MESSAGE_BUS_CONFIG } from './message_bus_config';
/**
 *
 */
export class MessageBus {
    hash;
    handlers = new Map();
    options = {};
    static getInstance() {
        if (!window.__messagingApiInstance) {
            window.__messagingApiInstance = new MessageBus();
        }
        return window.__messagingApiInstance;
    }
    constructor() {
        this.hash =
            Math.random().toString(36).substring(2, 9) +
                '-' +
                Math.random().toString(36).substring(2, 11);
        console.log(`MessagingApi constructor ${this.hash}`);
        browser.runtime.onMessage.addListener((message, sender, _sendResponse) => {
            if (this.isMessageBusFormat(message)) {
                const result = this.handleIncomingMessage(message, sender);
                console.dir(result);
                return result;
            }
            return false;
        });
    }
    // @ts-ignore
    publish(message) {
        const enrichedMessage = { ...message };
        if (!enrichedMessage.source) {
            enrichedMessage.source = ContextDetector.getRequestContext();
        }
        //if (this.options.verbose) {
        console.debug(`Publishing message: %O from ${this.hash} to ${enrichedMessage.target} with type ${enrichedMessage.type} and source ${enrichedMessage.source}`, enrichedMessage);
        //}
        if (ContextDetector.isBackgroundScript()) {
            return this.dispatchFromBackground(enrichedMessage);
        }
        // If we're in a content script, sidebar, or popup
        else {
            return browser.runtime.sendMessage(message);
        }
    }
    isMessageBusFormat(message) {
        return (message &&
            typeof message === 'object' &&
            'type' in message &&
            'target' in message);
    }
    async handleIncomingMessage(message, sender) {
        // If we're in the background script, we might need to route messages
        if (ContextDetector.isBackgroundScript()) {
            // Route to specific target if specified
            if (message.target &&
                message.target !== 'background' &&
                message.target !== 'broadcast') {
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
    subscribe(type, handler) {
        if (!this.handlers.has(type)) {
            this.handlers.set(type, new Set());
        }
        this.handlers.get(type)?.add(handler);
        // Return unsubscribe function
        return () => {
            this.handlers.get(type)?.delete(handler);
        };
    }
    async routeMessage(message, sender) {
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
    async broadcastMessage(message, sender) {
        // Broadcast to all tabs if needed
        if (message.target === 'broadcast' || message.target === 'content') {
            const tabs = await browser.tabs.query({});
            for (const tab of tabs) {
                // Don't send back to originating tab
                if (tab.id !== sender.tab?.id) {
                    try {
                        await browser.tabs.sendMessage(tab.id, message);
                    }
                    catch (e) {
                        // Tab might not have content script loaded, ignore
                    }
                }
            }
        }
    }
    triggerHandlers(message) {
        // @ts-ignore
        const handlers = this.handlers.get(
        // @ts-ignore
        message.type);
        if (!handlers)
            return undefined;
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
            console.log(`Triggered ${handlers.size} handlers for message type ${message.type}`);
        MESSAGE_BUS_CONFIG.CONTENTMESSAGEHANDLERLOGGER && console.dir(result);
        return result;
    }
    async dispatchFromBackground(message) {
        console.log('dispatching from background');
        // If broadcasting or specific routing
        if (message.target === 'broadcast') {
            await this.broadcastMessage(message, { tab: { id: -1 } });
            // Also trigger local handlers
            return this.triggerHandlers(message);
        }
        else if (message.target === 'content') {
            // If tabId is specified, send to that specific tab
            if (message.tabId) {
                console.log(`Sending message to tab ${message.tabId}`);
                return browser.tabs.sendMessage(message.tabId, message);
            }
            // If no tabId but target is content, this is an error
            else {
                throw new Error('Cannot route message to content script: No tabId specified');
                // Alternative: broadcast to all tabs instead of throwing
                //return this.broadcastToAllContentScripts(message);
            }
        }
        // Handle locally
        else {
            return this.triggerHandlers(message);
        }
    }
    async broadcastToAllContentScripts(message) {
        const tabs = await browser.tabs.query({});
        for (const tab of tabs) {
            if (tab.id) {
                try {
                    await browser.tabs.sendMessage(tab.id, message);
                }
                catch (e) {
                    // Tab might not have content script loaded, ignore
                    console.debug(`Failed to send message to tab ${tab.id}:`, e);
                }
            }
        }
    }
}
// export const messageBus = MessageBus.getInstance();
//# sourceMappingURL=message_bus.js.map