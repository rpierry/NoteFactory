# NoteFactory

A little demo project I used to learn the web audio API, htmx, and a bit of hyperscript while spending a bit more time with Typescript and SignalR.

The server side implementation is super simple - no actual persistence or auth.

The client side is a compelling example of why you should never let devs do visual design.  I chose to play with some CSS things I hadn't had the chance to use yet.

I'm using Renerick's extension for htmx with SignalR and ASP.NET Core - https://github.com/Renerick/htmx-signalr - and mixing it with some standard SignalR calls that I make by grabbing the HubConnection from the extension on create.

The reverb uses an IR from EchoThief - http://www.echothief.com/downloads/ 

As of now this is running on a free azure instance here: https://notefactoryweb.azurewebsites.net/
