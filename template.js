var ejs = require("ejs"),
	fs = require("fs"),
	url = require("url");

module.exports = function(req, res) {
	var u = url.parse(req.url),
		pathname = u.pathname === "/" ? "/index" : u.pathname;
	
	fs.readFile(__dirname + "/templates" + pathname + ".ejs", function(err, content) {
		if(err) {
			res.statusCode = 501;
			return res.end(err.toString());
		}

		res.setHeader("Content-type", "text/html");
		res.end(ejs.render(content.toString("utf8"), req));
	});
}
