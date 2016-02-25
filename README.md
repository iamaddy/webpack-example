# webpack-example

选用gulp+webpack方式来支撑前端的工作流，项目需求：
- 最小化配置项（webpack.config.js）
- 所有资源使用增量发布策略，文件名全部 md5 版本化
- 支持多种模块化策略，使用 webpack 进行模块化打包
- 自动替换 html/js 内部资源引用路径，替换为 cdn/md5 版本化路径
- 轻松支持 js资源内嵌到页面
- 开发时监听文件，自动上传到开发机

项目目录结构如下：
```
src/
	js/
	widget/
	css/
	img/
	project_tpl/
	gulpfile.js
	app/
		js/
		css/
		img/
		index.html
		tpl/
		webpack.config.js
		gulpfile.js
app/
```		 

src目录下是项目的源代码，每个目录（app）即为一个项目，为了尽量避免冲突，一个人开发并维护一个项目下的代码。

project_tpl为项目的模板，通过gulp新建项目，完成一些初始化配置，初始化后基本无需配置即可进行项目开发。

js/css/img为站点的一些公共资源模块，widget为公共基础组件。

app项目下为业务的css、js、tpl目录，tpl为前端模板目录，可以通过webpack的html-loader插件加载。

gulpfile.js、webpack.config.js 为项目的构建工具配置文件。

#### webpack配置文件
```
var webpack = require('webpack');
var globalConfig = require('../global.config');
var commonJSEntry = globalConfig.jsCommon;
var path          = require('path');

module.exports = {
// 如果项目有多个HTML，就配置多个入口
// 配置js入口文件，base是公共库配置，除了打包工具自动化抽取共用的模块，也可以自定义配置哪些模块为共用的。
entry:{
	index: './js/index',
	base: commonJSEntry,
},
// 文件产出目录
output:{
	filename:'../test/js/[name].js',
	// 异步加载的chunk，命名规则，chunk我暂时理解为从合并的代码里分离出来的代码块，在处理非首屏逻辑，或者异步加载逻辑可以用这个。只要在js代码中用require.ensure来异步加载模块即可。
	chunkFilename: '../test/js/[chunkhash:8]_chunk.js',
	// 资源文件的CDN前缀
	publicPath: debug ? "" : '//cdn.xxx.com/webpack/test/'
},
resolve: {
	// 模块的别名，通常可以为第三方模块
	alias: {
		ajax: "../../js/base/ajax",
		dom: "../../js/base/dom"
	},
	// root模块的根路径，可以指定从哪里找模块，可以为数组[]
	// 这样在模块依赖的时候就不要写require(../../../xx.js)
	// 直接为require(xx)
	root: path.resolve('../../js')
},
// 模块加载器，加载不同类型的文件，需要下载或者开发loader插件，以下为加载html模块的加载器
loader: [
	{test: /\.html$/,   loader: 'html'}
],
/*
1、可以通过配置文件指定哪位模块为公共模块，这样功能模块可以长期缓存。
解释下这个插件的意思，就是提取公共的chunk，base对应了entry中的配置，"../test/js/common.js"是产出的路径，也就是将commonJSEntry中的配置模块合并成一个common.js文件。
2、webpack也可自动提取页面之间公用的代码作为公共部分。下面的代码即是自动提取公共代码了。
var commonsPlugin = new webpack.optimize.CommonsChunkPlugin("../test/js/common.js");
*/
plugins: [
	new webpack.optimize.CommonsChunkPlugin("base", "../test/js/common.js")
]
};
```

#### gulp跑起来

webpack最终是当做gulp的一个插件来运行，读取的上述的webpack配置文件。

```
gulp.task('watch-html', function() {
	// upload
});

gulp.task('watch-module', function() {
	var watchPath = [
		'../js/**',
		'../css/**',
		'../widget/**',
		'js/**',
		'css/**',
		'tpl/**'
	];
	gulp.watch(watchPath, function(event){
		gulp.src(watchPath)
			.pipe(webpack(require('webpack.config')))
			.pipe(gulp.dest(releaseRelativePath + projectName))
			.pipe(upload(opt, function(err, data){})
	})
});

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
	return gulp.src(watchPath)
				.pipe(webpack(require('webpack.config')))
				.pipe(uglify())
				.pipe(hash())
				.pipe(rename(function(path) {
				// 获取当前的日期，将发布文件已日期归类，更方便查找文件
					path.dirname = path.dirname + '/' + year + month + day;
				})
				.pipe(gulp.dest(releaseRelativePath + projectName))
				.pipe(upload(opt, function(err, data){})
	})
});

// release build html
gulp.task('release', ['release-module'], function(){
	gulp.src(['**/*.html'])
		.pipe(parseHtml(releaseRelativePath + projectName, CDN_URL))
		.pipe(gulp.dest(releaseRelativePath + projectName))
		.pipe(upload(opt, function(err, data){})
		.pipe(uploadToCDN())
})
```
1、项目开始前，通过gulp init -p YourProjectName 来初始化项目 

2、开发和发布两套命令，开发：gulp，发布：gulp release 

3、需要自行编写gulp插件来替换html中引用资源的路径，原理也很简单，在构建webpack模块后，将产出的文件列表与原文件的映射关系保存在数组，查找html中引用的js路径，替换成hash后就可以了。

通过以上方法，就可以满足我们项目之前的需求，基本上做到自动化，自动构建，自动发布脚本，html文件走内部发布系统发布。
