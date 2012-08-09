var IncomingForm = require("formidable").IncomingForm,
	fs = require("fs"),
	template = require("./template"),
	url = require("url"),
	http = require("http");

var fileRequests = {},
	guid = 0;

var server = http.createServer(function(req, res) {
	var u = url.parse(req.url, true),
		g = u.query.guid;

	if(req.url.indexOf("/retrieve") > -1) {
		var fileReq = fileRequests[g];
		if(!fileReq) {
			res.statusCode = 404;
			return res.end("file not found");
		}
		var part = fileReq.part;
		res.setHeader("Content-type", part.mime);
		for(var i = 0; i < fileReq.buffer.length; i++)
			res.write(fileReq.buffer[i]);
		// delete the tmp buffer to prevent mem leak
		delete fileReq.buffer;

		part.pipe(res);
		part.on("end", function() {
			delete fileRequests[g];
			res.end();
		});
		fileReq.req.resume();
	} else if(req.url.indexOf("/upload") > -1) {
		var form = new IncomingForm;
		form.onPart = function(part) {
			if(!part.filename) {
				return form.handlePart(part);
			}

			console.log("Incoming file: %s", part.filename);
			req.pause();

			fileRequests[g] = {
				buffer: [],
				form: form,
				req: req,
				part: part,
				time: (new Date).valueOf()
			}

			part.on("data", function(chunk) {
				// one chunk comes throught regardless of req.pause, save it, then delete it
				// it would be nice to be able to do part.pause and have it stop at the next (this) header
				if(fileRequests[g].buffer)
					fileRequests[g].buffer.push(chunk);
				console.log("Bytes %s: %s", fileRequests[g].buffer ? "Buffered" : "Transfered", form.bytesReceived);
			});

			form.on("end", function() {
				res.end();
			});

			res.setHeader("Content-type", "text/html");
			res.end("Thank you for flying Donkey Express");
		};

		form.parse(req);
	} else if(req.url.indexOf("favicon") > -1) {
		res.statusCode = 404;
		res.end();
	} else {
		req.guid = guid++;
		template(req, res);
	}
}).listen(8123);
