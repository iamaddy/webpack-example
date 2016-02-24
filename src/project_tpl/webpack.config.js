var webpack = require('webpack');
var globalConfig = require('../global.config');
var commonJSEntry = globalConfig.jsCommon;
var path          = require('path');

// {#projectName#} 是项目的目录名称，占位符，做替换用的
module.exports = {
    init: function(debug){
        return {
            // 如果项目有多个HTML，就在这里配置js入口文件，base是公共基础配置
            entry:{
            	index: './js/index',
            	base: commonJSEntry,
            },
            output:{
                filename:'../{#projectName#}/js/[name].js',
                chunkFilename: '../{#projectName#}/js/[chunkhash:8]_chunk.js',
                publicPath: debug ? "" : '//wximg.qq.com/wxgame/webpack/{#projectName#}/'
            },
            resolve: {
                // 模块的别名
                // 第三方模块
                /*alias: {
                    ajax: "../../js/base/ajax",
                    dom: "../../js/base/dom"
                },*/
                // 模块的跟路径，可以指定从哪里找js模块，可以为数组，这样就不要写../../xx.js
                root: path.resolve('../js')
            },
            loader: [
                 {test: /\.html$/,   loader: 'html'}
            ],
            plugins: [
                new webpack.optimize.CommonsChunkPlugin("base", "../{#projectName#}/js/common.js")
            ]
        }
    }
};