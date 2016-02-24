var fs      = require('fs');
var path    = require('path');
var gulp    = require('gulp')
var through = require('through2');
var gutil   = require('gulp-util');
var colors  = require('colors');



var argv      = process.argv;	// 0:node; 1:gulp.js; 2:task; 3:......
var taskName  = argv[2];
var taskParam = {}; // [].slice.call(argv,3);
for(var i = 0; i < argv.length; i++){
	if(argv[i].indexOf("-") === 0){
		if(argv[i + 1] && argv[i + 1].indexOf("-") === 0){
			taskParam[argv[i]] = "";
		}else{
			taskParam[argv[i]] = argv[i + 1] || "";
			i++;
		}
	}
}

gulp.task('init', function(){
	if(!taskParam['-p']){
		console.log(('error: need project name, please command: gulp init -p yourProjectName').red);
		return;
	}
	var param       = taskParam['-p'].split("/");
	var projectName = param[0];
	if(!projectName){
		console.log(('error: need project name.').red);
		return;
	}
	if(fs.existsSync(projectName)){
		console.log(('error: ' + projectName + " project has existed.").red);
		return;
	}
	gulp.src('project_tpl/**')
		.pipe(thr(function(file, enc){
			var content = file.contents.toString();
			content = content.replace(/\{#projectName#\}/g, projectName);
			file.contents = new Buffer(content);
		})).pipe(gulp.dest(projectName));

	console.log(('init ' + projectName + " success.").green);
});

function thr(func){
	return through.obj(function(file, enc, callback) {
		if (file.isNull()){
			return callback(null, file);
		}
		if (file.isStream()){
			this.emit('error', new gutil.PluginError(PLUGIN_NAME, 'Streaming not supported'));
			return callback();
		}
		file = func(file, enc) || file;
		callback(null, file);
	})
}