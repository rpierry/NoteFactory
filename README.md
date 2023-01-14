# NoteFactory

## Overview
A little demo project I used to learn the web audio API, htmx, and a bit of hyperscript while spending a bit more time with Typescript and SignalR.

The server side implementation is super simple - no actual persistence or auth.

The client side is a compelling example of why you should never let devs do visual design.  I chose to play with some CSS things I hadn't had the chance to use yet.

I'm using Renerick's extension for htmx with SignalR and ASP.NET Core - https://github.com/Renerick/htmx-signalr - and mixing it with some standard SignalR calls that I make by grabbing the HubConnection from the extension on create.

The reverb uses an IR from EchoThief - http://www.echothief.com/downloads/ 

As of now this is running on a free azure instance here: https://notefactoryweb.azurewebsites.net/

## Instructions

You can use this stand-alone, or network with other people.  To make a shared session, put in a name and pick Create.  Once you have the session id someone else can Join with that id. The Share Pattern button will share your current pattern and all settings (parameters, envelope, effects) to everyone in the chat.  Click the link presented to apply it to your board.  You can also check the Share Note Updates Live button.  This will send every note that you set or clear in the grid to everyone in the session who has the box checked.  To make something collaboratively, have someone share a board so you get the same settings (like steps), check the box, and away you go.  You can leave the synth playing while fiddling with everything and it should be fine.

The envelope settings are designed so that notes stay bounded to the step they are in (vs overflowing into the next beat).  Think of the sliders for Attack, Decay, and Release Times as percentages of the overall beat.  The system tries to release the note so that the full Release Time can play - this may involve cutting the attack/decay short and/or skipping any sustain entirely if the release time is really long.

The thickness effect brings in another oscillator and a sub, each of which are panned differently and detuned slightly.  

The max setting of Feedback for the delay is slightly less than 1 so the sound will eventually stop if you turn this up all the way. 

As mentioned above, the backend doesn't persist anything and it's running on a free tier, so don't be surprised if your sessions go away.  While userids are unique, names don't have to be, and there's no auth going on, either.
