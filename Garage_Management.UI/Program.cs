using Microsoft.Extensions.FileProviders;

var builder = WebApplication.CreateBuilder(args);

var app = builder.Build();

if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Error");
    app.UseHsts();
}

app.UseHttpsRedirection();

// Serve wwwroot ở 2 path:
//  - /wwwroot/...  (giữ nguyên relative ../../wwwroot/... trong các file HTML hiện có)
//  - /...          (fallback cho path chuẩn /css/..., /js/..., /lib/...)
app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(
        Path.Combine(builder.Environment.ContentRootPath, "wwwroot")),
    RequestPath = "/wwwroot"
});
app.UseStaticFiles();

// Serve folder Pages/ để các file .html truy cập được qua /Pages/...
app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(
        Path.Combine(builder.Environment.ContentRootPath, "Pages")),
    RequestPath = "/Pages"
});

// Root "/" → redirect tới trang Dashboard mặc định (cho khách chưa đăng ký)
app.MapGet("/", () => Results.Redirect("/Pages/Dashboard/Index.html"));

app.Run();
