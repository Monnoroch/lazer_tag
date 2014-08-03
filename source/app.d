import vibe.d;

shared static this() {
	auto router = new URLRouter;
	auto fsettings = new HTTPFileServerSettings;
	fsettings.serverPathPrefix = "/static/";
	router.get("/static/*", serveStaticFiles("./static/", fsettings));
	router.get("/", &index);

	auto settings = new HTTPServerSettings;
	settings.port = 9000;
	settings.bindAddresses = ["::1", "127.0.0.1"];
	listenHTTP(settings, router);
}

void index(HTTPServerRequest req, HTTPServerResponse res) {
	res.contentType = "text/html";
	res.bodyWriter.write(vibe.core.file.openFile("static/index.html"));
}
