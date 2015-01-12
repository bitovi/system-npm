QUnit.module("system-npm plugin");
var GlobalSystem = window.System;


var makeIframe = function(src){
	var iframe = document.createElement('iframe');
	window.removeMyself = function(){
		delete window.removeMyself;
		document.body.removeChild(iframe);
		QUnit.start();
	};
	document.body.appendChild(iframe);
	iframe.src = src;
};

asyncTest("createModuleName and parseModuleName", function(){
	GlobalSystem['import']("npm-extension")
		.then(function(npmExtension){
			var parsed = npmExtension.parseModuleName("abc/foo/def","bar");
			equal(parsed.modulePath, "foo/def", "is absolute");
			
			var parsed = npmExtension.parseModuleName("abc#./foo/def","bar");
			equal(parsed.modulePath, "./foo/def", "is relative");
			
			var res = npmExtension.createModuleName(parsed);
			equal(res,"abc#foo/def", "set back to absolute");
			
		}).then(QUnit.start);
	
});

asyncTest("transpile works", function(){
	Promise.all([
		System.import("transpile"),
		System.import("jquery")
	]).then(function(res){
		var transpile = res[0],
			$ = res[1];
			
		equal(typeof transpile, "object", "object returned");
		equal(typeof $, "function", "function returned");
		
		return new Promise(function(resolve, reject){

				$.ajax("../node_modules/transpile/test/tests/es6.js",{dataType: "text"}).then(function(data){
					var res = transpile.to({
						source: ""+data, 
						address: "../node_modules/transpile/test/tests/es6.js", 
						name: "tests/es6", 
						metadata: {format: "es6"}
					}, "cjs");
					
					return $.ajax("../node_modules/transpile/test/tests/expected/es6_cjs.js",{dataType: "text"})
						.then(function(answer){
							QUnit.equal(answer, res);
					});
					
				}, reject).then(resolve, reject);
		});
		
	}).then(start);
});


asyncTest("Loads globals", function(){
	GlobalSystem.import("jquery").then(function($){
		ok($.fn.jquery, "jQuery loaded");
	}).then(start);
});

asyncTest("meta", function(){

	GlobalSystem.import("test/meta").then(function(meta){
		equal(meta,"123", "got 123");
	}).then(start);
});

asyncTest("module names that start with @", function(){
	GlobalSystem.paths["@foo"] = "test/foo.js";
	GlobalSystem.import("@foo").then(function(foo){
		equal(foo,"bar", "got 123");
	}).then(start);
});

asyncTest("jquery-ui", function(){
	GlobalSystem.paths["@foo"] = "test/foo.js";
	Promise.all([
		GlobalSystem.import("jquery"),
		GlobalSystem.import("jquery-ui/draggable")
	]).then(function(mods){
		var $ = mods[0];
		ok($.fn.draggable);
	}).then(start);

});

asyncTest("import self", function(){
	Promise.all([
		GlobalSystem.import("system-npm"),
		GlobalSystem.import("system-npm/test/meta")
	]).then(function(mods){
		equal(mods[0], "example-main", "example-main");
		equal(mods[1], "123", "system-npm/test/meta");
	}).then(start);
});

asyncTest("module names", function(){
	makeIframe("not_relative_main/dev.html");
});

asyncTest("main does not include .js in map", function(){
	makeIframe("map_main/dev.html");
});

asyncTest("ignoreBrowser", function(){
	makeIframe("ignore_browser/dev.html");
});

asyncTest("directories.lib", function(){
	makeIframe("directories_lib/dev.html");
});

asyncTest("github ranges as requested versions are matched", function(){
	makeIframe("git_ranges/dev.html");
});

// Only run these tests for StealJS (because it requires steal syntax)
if(window.steal) {
	asyncTest("canjs", function(){
		Promise.all([
			GlobalSystem.import("can"),
			GlobalSystem.import("can/control/control")
		]).then(function(mods){
			var can = mods[0],
				Control = mods[1];
			ok(Control.extend, "Control has an extend method");
			ok(can.Control.extend, "control");
		}).then(start);
		
	});
}

QUnit.start();
