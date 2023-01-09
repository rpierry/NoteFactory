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
        
        public IActionResult Index()
        {
            return View();
        }

        public IActionResult CreateOrConnect(string participantName)
        {
            return View(new { participantName });
        }
    }
}
