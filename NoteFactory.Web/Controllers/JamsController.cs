using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.ModelBinding;
using System.Diagnostics;
using System.Net;
using System.Net.Http.Headers;
using System.Text;

namespace NoteFactory.Web.Controllers
{
    public class JamsController : Controller
    {
        IChatManager _chatManager;
        public JamsController(IChatManager chatManager)
        {
            _chatManager = chatManager;
        }

        string CreateId()
        {
            string? id;
            do
            {
                var sb = new StringBuilder();
                for(var i = 0; i < 8; i++)
                {
                    var c = (char)(65 + Random.Shared.Next(26));
                    sb.Append(c);
                }
                id = sb.ToString();
            } while (_chatManager.GetChat(id) != null);
            return id;
        }

        public IActionResult Create(string participantName)
        {
            var id = CreateId();
            var c = _chatManager.CreateChat(id);
            var p = c.AddParticipant(participantName);

            return RedirectToAction(nameof(Current), new { id, participantId = p.Id });
        }

        public IActionResult Connect(string jamId, string participantName)
        {
            var c = _chatManager.GetChat(jamId);
            if (c == null) return NotFound();

            var p = c.AddParticipant(participantName);

            return RedirectToAction(nameof(Current), new { id = c.Id, participantId = p.Id });
        }

        public IActionResult Current(string id, int participantId)
        {            
            return View(new { id, participantId });
        }

        public IActionResult SendMessage(string id, int participantId, string message)
        {
            var c = _chatManager.GetChat(id);
            if (c == null) return NotFound();

            c.AppendMessage(participantId, message);
            return View("_SendMessageForm", new { id, participantId });
        }

        public IActionResult Messages(string id, int participantId)
        {
            var c = _chatManager.GetChat(id);
            if (c == null) return NotFound();

            var messages = c.MessagesSince(DateTime.MinValue).ToArray();
            return View(new { messages, participantId });
        }

        /* //conditional GETs work but aren't really a fit for polling and incremental message delivery
        [ResponseCache(Duration = 1, Location = ResponseCacheLocation.Any, VaryByQueryKeys = new[] { "id", "participantId" })]
        public IActionResult Messages(string id, int participantId)
        {
            var c = _chatManager.GetChat(id);
            if (c == null) return NotFound();

            var lastModified = c.LastUpdated;
            //use ticks so when we do the compare inside .Since the differing millis don't mess with us
            var lastModifiedString = lastModified.Ticks.ToString();
            var eTag = lastModifiedString;
            var since = DateTime.MinValue;

            if(Request.Headers.IfNoneMatch.Count > 0)
            {                
                var providedETag = Request.Headers.IfNoneMatch[0];
                if (providedETag == eTag)
                {
                    return StatusCode((int)HttpStatusCode.NotModified);
                }
                since = new DateTime(long.Parse(providedETag));
            }

            var messages = c.MessagesSince(since).ToArray();
                                    
            Response.Headers.LastModified = lastModified.ToString();
            Response.Headers.ETag = eTag;            

            return View(new { messages });
        }
        */

        public IActionResult Disconnect(string id, int participantId)
        {
            var c = _chatManager.GetChat(id);
            if (c == null) return NotFound();

            c.RemoveParticipant(participantId);
            if(c.IsEmpty)
            {
                _chatManager.DeleteChat(id);
            }

            return RedirectToAction(nameof(Index));
        }
        public IActionResult Index()
        {
            return View();
        }
    }
}
