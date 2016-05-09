var helpers = require("./helpers")(System);

QUnit.module("Importing npm modules");

QUnit.test("process.cwd()", function(assert){
	var done = assert.async();

	var appModule = "module.exports = process.cwd();";

	var loader = helpers.clone()
		.rootPackage({
			name: "app",
			main: "main.js",
			version: "1.0.0"
		})
		.withModule("app@1.0.0#main", appModule)
		.loader;

	loader["import"]("app")
	.then(function(app){
		assert.equal(typeof app, "string", "process.cwd is a string");
		assert.equal(app[app.length - 1], "/", "ends in a slash");
	})
	.then(done, done);
});

QUnit.module("Importing npm modules using 'browser' config");

QUnit.test("Array property value", function(assert){
	var done = assert.async();

	var appModule = "module.exports = 'bar';";

	var loader = helpers.clone()
		.rootPackage({
			name: "app",
			main: "main.js",
			version: "1.0.0",
			browserify: {
				transform: [
					"loose-envify"
				]
			}
		})
		.withModule("app@1.0.0#main", appModule)
		.loader;

	loader["import"]("app")
	.then(function(app){
		assert.equal(app, "bar", "loaded the app");
	})
	.then(done, done);
});

QUnit.test("Specifies a different main", function(assert){
	var done = assert.async();

	var appModule = "module.exports = 'bar';";

	var loader = helpers.clone()
		.rootPackage({
			name: "app",
			main: "main.js",
			version: "1.0.0",
			browserify: "app.js"
		})
		.withModule("app@1.0.0#app", appModule)
		.loader;

	loader["import"]("app")
	.then(function(app){
		assert.equal(app, "bar", "loaded the app");
	})
	.then(done, done);
});

QUnit.module("Importing packages with /index convention");

QUnit.test("Retries with /index", function(assert){
	var done = assert.async();

	var appModule = "module.exports = { worked: true };";

	var loader = helpers.clone()
		.rootPackage({
			name: "app",
			main: "main.js",
			version: "1.0.0"
		})
		.withModule("app@1.0.0#foo/index", appModule)
		.loader;

	loader["import"]("app/foo")
	.then(function(mod){
		assert.ok(mod.worked, "it loaded the index variant");
	})
	.then(done, done);
});

QUnit.test("Doesn't retry non-npm module names", function(assert){
	var done = assert.async();

	var appModule = "module.exports = { worked: true };";

	var loader = helpers.clone()
		.rootPackage({
			name: "app",
			main: "main.js",
			version: "1.0.0"
		})
		.withModule("node_modules/foo/package.json/index", "module.exports={}")
		.loader;

	var retried = false;

	loader["import"]("node_modules/foo/package.json")
	.then(null, function(err){
		assert.ok(err, "Got an error, didn't retry");
	})
	.then(done, done);
});

QUnit.module("Importing globalBrowser config");

QUnit.test("Correctly imports globalBrowser package that is depended on by another", function(assert){
	var done = assert.async();

	var loader = helpers.clone()
		.npmVersion(3)
		.rootPackage({
			name: "app",
			version: "1.0.0",
			main: "main.js",
			dependencies: {
				"dep": "1.0.0",
				"steal-builtins": "1.0.0"
			}
		})
		.withPackages([
			{
				name: "steal-builtins",
				main: "main.js",
				version: "1.0.0",
				globalBrowser: {
					"readline": "./thing",
					"http": "http"
				},
				dependencies: {
					"http": "~0.0.0"
				}
			},
			{
				name: "dep",
				version: "1.0.0",
				main: "main.js"
			},
			{
				name: "http",
				version: "0.10.0",
				main: "main.js"
			}
		])
		.withModule("http@0.10.0#main", "module.exports = 'http';")
		.withModule("steal-builtins@1.0.0#thing", "module.exports = require('http');")
		.withModule("dep@1.0.0#main", "module.exports = require('readline');")
		.withModule("app@1.0.0#main", "module.exports = require('dep');")
		.loader;

	
	loader["import"]("app")
		.then(function(val){
			assert.equal(val, "http", "correctly got the http module");
		})
		.then(done, function(err){
			assert.ok(!err, err.stack || err);
		});
});

