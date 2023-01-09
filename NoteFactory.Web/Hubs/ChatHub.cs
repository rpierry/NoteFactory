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

        string CreateId(IChatManager chatManager)
        {
            string? id;
            do
            {
                var sb = new StringBuilder();
                for (var i = 0; i < 8; i++)
                {
                    var c = (char)(65 + Random.Shared.Next(26));
                    sb.Append(c);
                }
                id = sb.ToString();
            } while (chatManager.GetChat(id) != null);
            return id;
        }

        public record CreateRequest(string participantName);
        
        public async Task Create(IChatManager chatManager, CreateRequest createRequest) //string participantName)
        {
            var id = CreateId(chatManager);
            var c = chatManager.CreateChat(id);
            var p = await c.AddParticipant(createRequest.participantName);

            await Groups.AddToGroupAsync(Context.ConnectionId, id);
            
            var html = await ViewRenderer.RenderToString(Context.GetHttpContext(), "Jams/Current", new { id, participantId = p.Id }); 
            await Clients.Caller.ChatJoined(html);                        
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

            var html = await ViewRenderer.RenderToString(Context.GetHttpContext(), "Jams/Current",
                new { id = c.Id, participantId = p.Id });
            await Clients.Caller.ChatJoined(html);
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
