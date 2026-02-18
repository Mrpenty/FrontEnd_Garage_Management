var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddRazorPages(options =>
{
    // Map root "/" tới page Auth/Login (hoặc bất kỳ page nào bạn muốn làm default)
    options.Conventions.AddPageRoute("/Auth/Login", "");  // ← Dòng này quan trọng
    // Hoặc nếu có Homepage: options.Conventions.AddPageRoute("/Dashboard/Homepage", "");
});
var app = builder.Build();

// Configure the HTTP request pipeline.
if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Error");
    // The default HSTS value is 30 days. You may want to change this for production scenarios, see https://aka.ms/aspnetcore-hsts.
    app.UseHsts();
}

app.UseHttpsRedirection();
app.UseStaticFiles();

app.UseRouting();

app.UseAuthorization();

app.MapRazorPages();

app.Run();
