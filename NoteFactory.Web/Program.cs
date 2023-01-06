using Microsoft.AspNetCore.Routing.Constraints;
using NoteFactory.Web;

var builder = WebApplication.CreateBuilder(args);
//builder.Services.AddResponseCaching();
builder.Services.AddControllersWithViews();
builder.Services.AddSingleton<IChatManager>(new ChatManager());

var app = builder.Build();

if(!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Error");
    //app.UseHsts();
}

app.UseDefaultFiles();
app.UseStaticFiles();

//app.UseResponseCaching();

app.MapControllerRoute(
    "jams",
    "Jams/Disconnect/{id}/{participantId}",
    new
    {
        controller = "Jams",
        action = "Disconnect"
    },
    new { id = @"\w+", httpMethod = new HttpMethodRouteConstraint(HttpMethods.Post) });

app.MapControllerRoute(
    "jams",
    "Jams/Current/{id}/{participantId}",
    new
    {
        controller = "Jams",
        action = "Current"
    },
    new { id = @"\w+" });

app.MapControllerRoute(
    "jams",
    "Jams/SendMessage/{id}/{participantId}",
    new
    {
        controller = "Jams",
        action = "SendMessage"
    },
    new { id = @"\w+", httpMethod = new HttpMethodRouteConstraint(HttpMethods.Post) });

app.MapControllerRoute(
    "jams",
    "Jams/Messages/{id}/{participantId}",
    new
    {
        controller = "Jams",
        action = "Messages"
    },
    new { id = @"\w+" });

app.MapControllerRoute(
    "jams",
    "Jams/Index",
    new
    {
        controller = "Jams",
        action = "Index"
    });

app.MapControllerRoute(
    "jams",
    "Jams/Create",
    new 
    {
        controller = "Jams",
        action = "Create"
    },
    new { httpMethod = new HttpMethodRouteConstraint(HttpMethods.Post) });

app.Run();
