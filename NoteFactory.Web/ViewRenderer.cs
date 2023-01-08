using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.ModelBinding;
using Microsoft.AspNetCore.Mvc.Rendering;
using Microsoft.AspNetCore.Mvc.ViewEngines;
using Microsoft.AspNetCore.Mvc.ViewFeatures;

namespace NoteFactory.Web
{
    public static class ViewRenderer
    {
        public static async Task<string> RenderToString(HttpContext httpContext, string viewName, object model)
        {
            try
            {
                var viewEngine = httpContext.RequestServices.GetService<ICompositeViewEngine>();
                var tempDataProvider = httpContext.RequestServices.GetService<ITempDataProvider>();
                var actionContext =
                    new ActionContext(
                        httpContext,
                        httpContext.GetRouteData(),
                        new Microsoft.AspNetCore.Mvc.Abstractions.ActionDescriptor());

                using (var sw = new StringWriter())
                {
                    var viewResult = viewEngine.FindView(actionContext, viewName, false);
                    if (viewResult.View == null)
                    {
                        return $"View {viewName} not found.";
                    }

                    var viewDataDictionary = new ViewDataDictionary(new EmptyModelMetadataProvider(),
                        new ModelStateDictionary())
                    {
                        Model = model
                    };

                    var viewContext =
                        new ViewContext(
                            actionContext,
                            viewResult.View,
                            viewDataDictionary,
                            new TempDataDictionary(httpContext, tempDataProvider),
                            sw,
                            new HtmlHelperOptions());

                    await viewResult.View.RenderAsync(viewContext);
                    return sw.ToString();
                }
            }catch(Exception ex)
            {
                return ex.Message;
            }
        }
    }
}
