using Microsoft.AspNetCore.Routing.Constraints;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddControllersWithViews();

var app = builder.Build();

if(!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Error");
    //app.UseHsts();
}

app.UseDefaultFiles();
app.UseStaticFiles();

app.MapControllerRoute(
    "jams",
    "Jams/Disconnect/{id}",
    new
    {
        controller = "Jams",
        action = "Disconnect"
    },
    new { id = @"\w+", httpMethod = new HttpMethodRouteConstraint(HttpMethods.Post) });

app.MapControllerRoute(
    "jams",
    "Jams/Current/{id}",
    new
    {
        controller = "Jams",
        action = "Current"
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
