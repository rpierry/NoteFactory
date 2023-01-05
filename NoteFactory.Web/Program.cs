var builder = WebApplication.CreateBuilder(args);
var app = builder.Build();

app.UseDefaultFiles();
app.UseStaticFiles();


//app.MapGet("/", () => "Hello World!");
app.MapGet("/createSession", () => "Hello from the <em>server</em><ol><li>One</li><li>Two</li></ol>");

app.Run();
