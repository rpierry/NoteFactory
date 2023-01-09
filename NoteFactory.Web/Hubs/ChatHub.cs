using Microsoft.AspNetCore.SignalR;
using System.Diagnostics.Eventing.Reader;
using System.Text;
using static NoteFactory.Web.Hubs.ChatHub;

namespace NoteFactory.Web.Hubs
{
    public interface IChatHub
    {
        Task NewMessage(string html);
        Task ChatJoined(string html);
        Task LeftChat(string html);
    }

    public class ChatHub : Hub<IChatHub>
    {
        public override Task OnConnectedAsync()
        {
            return base.OnConnectedAsync();
        }

        public record CreateRequest(string participantName);
        
        async Task RenderCurrentView(Chat c, int participantId)
        {
            var messages = c.MessagesSince(DateTime.Now.AddMinutes(-30));

            var html = await ViewRenderer.RenderToString(Context.GetHttpContext(), "Jams/Current",
                new { id = c.Id, participantId, messages });
            await Clients.Caller.ChatJoined(html);
        }

        public async Task Create(IChatManager chatManager, CreateRequest createRequest) //string participantName)
        {            
            var c = chatManager.CreateChat();
            var id = c.Id;
            var p = await c.AddParticipant(createRequest.participantName);

            await Groups.AddToGroupAsync(Context.ConnectionId, id);

            await RenderCurrentView(c, p.Id);            
        }

        Chat GetChatOrThrow(IChatManager chatManager, string id)
        {
            var c = chatManager.GetChat(id);
            if (c == null) throw new HubException("The specified session doesn't exist.");
            return c;
        }

        public record ConnectRequest(string jamId, string participantName);
        public async Task Connect(IChatManager chatManager, ConnectRequest connectRequest)
        {
            var c = GetChatOrThrow(chatManager, connectRequest.jamId);

            var p = await c.AddParticipant(connectRequest.participantName);

            await Groups.AddToGroupAsync(Context.ConnectionId, c.Id);

            await RenderCurrentView(c, p.Id);
        }

        public record SendMessageRequest(string id, string participantId, string message);

        public async Task SendMessage(IChatManager chatManager, SendMessageRequest sendMessageRequest)
        {
            var c = GetChatOrThrow(chatManager, sendMessageRequest.id);

            var partIdInt = int.Parse(sendMessageRequest.participantId);
            await c.AppendMessage(partIdInt, sendMessageRequest.message);
        }

        public record DisconnectRequest(string id, string participantId);
        public async Task Disconnect(IChatManager chatManager, DisconnectRequest disconnectRequest)
        {
            var c = GetChatOrThrow(chatManager, disconnectRequest.id);
            await c.RemoveParticipant(int.Parse(disconnectRequest.participantId));
            if (c.IsEmpty)
            {
                chatManager.DeleteChat(disconnectRequest.id);
            }

            var html =
                await ViewRenderer.RenderToString(Context.GetHttpContext(), "Jams/Index", null);

            await Clients.Caller.LeftChat(html);
        }
    }
}
