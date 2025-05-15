# Message Bus

This is a fairly idiosyncratic implementation of a message bus in typescript. It 
is designed to be simple and easy to use, but developed for some specific use cases.

Unless you are using this for a specific purpose, you probably want to use a more
standard implementation

The main idea is to be able to have a centralized place to send messages to and from
different parts of the code. This is useful for decoupling different parts of the code

### Firefox web extensions

- content script
- background script
- popup script
- options script
- sidebar
- bridge script (injected into the page, window messaging)

### electron context

- renderer process
- main process
- preload process
- webview process
- devtools extension for electron

### dbus next clients

- dbus next server