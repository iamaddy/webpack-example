var fs        = require('fs');
var path      = require('path');
var gulp      = require('gulp');
var through   = require('through2');
var gutil     = require('gulp-util');
var webpack   = require('gulp-webpack');
var uglify    = require('gulp-uglify');
var hash      = require('gulp-hash');
var dest      = require('gulp-dest');
var parseHtml = require('gulp-parseHtml');
var rename    = require('gulp-rename');
var wxCDN	  = require('wxcdn');
var sftp	  = require('gulp-sftp');
var upload	  = require('gulp-upload');
var colors 	  = require('colors');
var inlineCss = require('gulp-inline_css');

var opt;
var basePath            = '../../src';
var CDN_URL             = '';
var projectName         = '{#projectName#}';
var releaseRelativePath = '../../';
var webpackConfig       = './webpack.config.js';

// .watch方法路径不要用 './xx'，会导致无法监测到新增文件
gulp.task('watch-html', function() {
	var watchPath = ['**/*.html'];
	gulp.watch(watchPath, function(event){
		var distPath = releaseRelativePath + path.relative(basePath, path.dirname(event.path));
		gulp.src(event.path)
			.pipe(gulp.dest(distPath))
			.pipe(upload(opt, function(err, data){
				if(err){
					console.log(err);
				}else if(data.ret === '0'){
					console.log(("upload success: " + data.path).green);
				}else{
					console.log("msg: " + data.msg);
				}
			}))
	})
});
// 监听除了html以外的文件，都作为webpack打包的模块文件。监听即合并一次。
gulp.task('watch-module', function() {
	var watchPath = [
		'../js/**', 
		'../css/**', 
		'../widget/**',
		'js/**', 
		'css/**', 
		'tpl/**'
	];
	var opt;
	gulp.watch(watchPath, function(event){
		gulp.src(watchPath)
			.pipe(webpack(require(webpackConfig).init(1)))
			.pipe(gulp.dest(releaseRelativePath + projectName))
			.pipe(upload(opt, function(err, data){
				if(err){
					console.log(err);
				}else if(data.ret === '0'){
					console.log(("upload success: " + data.path).green);
				}else{
					console.log("msg: " + data.msg);
				}
			}))

	});
});
gulp.task('watch', ['watch-html', 'watch-module']);
gulp.task('default', ['watch-html', 'watch-module']);
// release build webpack module
gulp.task('release-module', function() {
	var releasePath = [
		'../js/**', 
		'../css/**', 
		'../widget/**',
		'js/**', 
		'css/**', 
		'tpl/**'
	];
	return gulp.src(releasePath)
		.pipe(webpack(require(webpackConfig).init()))
		.pipe(uglify())
		.pipe(hash())
		.pipe(rename(function(path) {
			var date  = new Date();
			var year  = date.getFullYear();
			var month = date.getMonth() + 1;
			var day   = date.getDate();
			if(!/js/.test(path.dirname)){
				path.dirname  += '/js/';
			}
			// 除了common.js外的发布文件都放在日期文件目录下
			if(!/common_[a-zA-Z0-9]{8}/.test(path.basename) && !/[a-zA-Z0-9]{8}_chunk/.test(path.basename)){
				path.dirname = path.dirname + '/' + year + month + day;
			}
        }, parseHtml.mapPicker))
        .pipe(gulp.dest(releaseRelativePath + projectName))
        .pipe(upload(opt, function(err, data){
			if(err){
				console.log(err);
			}else if(data.ret === '0'){
				console.log(("upload success: " + data.path).green);
			}else{
				console.log("msg: " + data.msg);
			}
		}))

});
// release build html
gulp.task('release', ['release-module'], function(){
	var pathList = [];
	gulp.src(['**/*.html'])
		.pipe(parseHtml(releaseRelativePath + projectName, CDN_URL))
		.pipe(inlineCss())
		.pipe(gulp.dest(releaseRelativePath + projectName))
		.pipe(upload(opt, function(err, data){
			if(err){
				console.log(err);
			}else if(data.ret === '0'){
				console.log(("upload success: " + data.path).green);
				pathList.push(data.path);
			}else{
				console.log("msg: " + data.msg);
			}
		}))

	setTimeout(function(){
		uploadToCDN();
	}, 1000)
});


// 通过目录名上传
function uploadToCDN(){
	var basePath = "";
	var pushList = [];
	for(var i = 0; i < parseHtml.fileMapArr.length; i++){
		var p = path.join('.', parseHtml.fileMapArr[i]);
		var stat = fs.statSync(p);
		if(stat.isFile()){
			pushList.push({dest: path.resolve(path.relative(basePath, p)), md5: false});
		}else if(stat.isDirectory()){
			uploadToCDN(p);
		}
	}
	wxCDN.cdn.release(pushList);
}

