using Microsoft.AspNetCore.Routing.Constraints;
using NoteFactory.Web;
using NoteFactory.Web.Hubs;

//TODO: visual design
//TODO: scroll messages to end on new message
//TODO: undo/revert button after loading someone else's shared grid?

var builder = WebApplication.CreateBuilder(args);
//builder.Services.AddResponseCaching();
builder.Services.AddControllersWithViews();
builder.Services.AddHttpContextAccessor();
builder.Services.AddTransient(typeof(IMessageSubscriber), typeof(HubMessageSubscriber));
builder.Services.AddSingleton<IChatManager, ChatManager>();
builder.Services.AddSignalR(
    o =>
    {
#if DEBUG
        o.EnableDetailedErrors = true;
#endif
    });
#if DEBUG
builder.Logging.AddFilter("Microsoft.AspNetCore.SignalR", LogLevel.Debug);
#endif


var app = builder.Build();

if(!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Error");
    //app.UseHsts();
}

app.UseDefaultFiles();
app.UseStaticFiles();

//app.UseResponseCaching();

app.MapHub<ChatHub>("JamsHub");

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
    "Jams/CreateOrConnect",
    new
    {
        controller = "Jams",
        action = "CreateOrConnect"
    },
    new { httpMethod = new HttpMethodRouteConstraint(HttpMethods.Post) });

/* moved to signalr
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
    "Jams/Create",
    new 
    {
        controller = "Jams",
        action = "Create"
    },
    new { httpMethod = new HttpMethodRouteConstraint(HttpMethods.Post) });

app.MapControllerRoute(
    "jams",
    "Jams/Connect",
    new
    {
        controller = "Jams",
        action = "Connect"
    },
    new { httpMethod = new HttpMethodRouteConstraint(HttpMethods.Post) });
*/

app.Run();
