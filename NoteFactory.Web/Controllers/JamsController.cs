using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.ModelBinding;

namespace NoteFactory.Web.Controllers
{
    public class JamsController : Controller
    {
        public IActionResult Create()
        {
            var id = "awefawef";
            return RedirectToAction(nameof(Current), new { id });
        }

        public IActionResult Current(string id)
        {            
            return View(new { id });
        }

        public IActionResult Disconnect(string id)
        {
            return RedirectToAction(nameof(Index));
        }
        public IActionResult Index()
        {
            return View();
        }
    }
}
