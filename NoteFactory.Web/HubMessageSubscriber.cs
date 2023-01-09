using Microsoft.AspNetCore.SignalR;
using NoteFactory.Web.Hubs;
using static NoteFactory.Web.Hubs.ChatHub;

namespace NoteFactory.Web
{
    public interface IMessageSubscriber
    {
        Task MessageAppended(string chatId, Message m);
    }

    public class HubMessageSubscriber : IMessageSubscriber
    {
        IHubContext<ChatHub, IChatHub> _context;
        IHttpContextAccessor _httpContext;
        public HubMessageSubscriber(IHubContext<ChatHub, IChatHub> context, IHttpContextAccessor httpContext)
        {
            _context = context;
            _httpContext = httpContext;
        }

        public async Task MessageAppended(string chatId, Message m)
        {
            
            var messageHtml =
                await ViewRenderer.RenderToString(_httpContext.HttpContext, "_Message",
                    new { Message = m });

            await _context.Clients.Group(chatId).NewMessage(messageHtml);            
        }
    }
}
