// webpack.base.js
const path = require('path');

const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

const isDev = process.env.NODE_ENV === 'development'; // 是否是开发模式
const appSrc = path.resolve(__dirname, '../src');

module.exports = {
  entry: path.join(__dirname, '../src/index.tsx'), // 入口文件
  // 打包文件出口
  output: {
    filename: 'static/js/[name].[chunkhash:8].js', // 每个输出js的名称
    path: path.join(__dirname, '../dist'), // 打包结果输出路径
    clean: true, // webpack4需要配置clean-webpack-plugin来删除dist文件,webpack5内置了
    publicPath: '/', // 打包后文件的公共前缀路径
  },
  /**
   * 
   在webpack5之前做缓存是使用babel-loader缓存解决js的解析结果,cache-loader缓存css等资源的解析结果,
   还有模块缓存插件hard-source-webpack-plugin,配置好缓存后第二次打包,通过对文件做哈希对比来验证文件
   前后是否一致,如果一致则采用上一次的缓存,可以极大地节省时间。
   webpack5 较于 webpack4,新增了持久化缓存、改进缓存算法等优化,通过配置 cache 持久化缓存,
   来缓存生成的 webpack 模块和 chunk,改善下一次打包的构建速度,可提速 90% 左右,

   第一次打包用了1061毫秒
   第二次打包用了 256毫秒

   缓存的存储位置在node_modules/.cache/webpack,里面又区分了development和production缓存
   * 
   */
  cache: {
    type: 'filesystem', // 使用文件缓存
  },
  module: {
    rules: [
      {
        /**
         * 如果引入了第三方包，比如antd，那么如果想要antd里的js代码也能按照本工程的.browserslistrc
         * 内容进行js代码降级处理的话，就不能排除 node_modules，因为antd是在 node_modules里的
         */

        include: [appSrc], // 只对项目src文件进行loader解析
        test: /\.(js|jsx|ts|tsx)$/,

        /**
         * 由于thread-loader不支持抽离css插件MiniCssExtractPlugin.loader,
         * 所以这里只配置了多进程解析js,开启多线程也是需要启动时间,大约600ms左右,所以适合规模比较大的项目。
         */
        use: ['thread-loader', 'babel-loader'],
      },
      /**
       * 开始我以为添加了 path.resolve(__dirname, '../node_modules/antd-mobile')
       * 就可以解决css这个loader解析不到antd-mobile里css的问题，结果是没有解决，
       * 因为报错的css文件链接为
       * ./node_modules/.pnpm/antd-mobile@5.36.1_react-dom@18.3.1_react@18.3.1/node_modules/antd-mobile/es/global/global.css
       * 这个链接是 .pnpm 文件夹下的引用，所以配置路径为 ../node_modules/antd-mobile 肯定是不对的
       * 原因就是使用pnpm安装依赖引发的问题，具体细节要以后研究，暂时先注释吧
       */
      {
        // include: [
        //   appSrc,
        //   path.resolve(__dirname, '../node_modules/antd-mobile'),
        // ],
        test: /\.css$/, //匹配 css 文件
        // 注意 postcss-loader 放的位置， postcss-loader 的配置放在了postcss.config.js 中
        use: [
          isDev ? 'style-loader' : MiniCssExtractPlugin.loader, // 开发环境使用style-looader,打包模式抽离css
          'css-loader',
          'postcss-loader',
        ],
      },
      {
        include: [appSrc],
        test: /\.less$/, //匹配sless 文件
        // 注意 postcss-loader 放的位置， postcss-loader 的配置放在了postcss.config.js 中
        use: [
          isDev ? 'style-loader' : MiniCssExtractPlugin.loader, // 开发环境使用style-looader,打包模式抽离css
          'css-loader',
          'postcss-loader',
          'less-loader',
        ],
      },
      // 对于图片文件,webpack4使用file-loader和url-loader来处理的,
      // 但webpack5不使用这两个loader了,而是采用自带的asset-module来处理
      // 这个也能处理css的背景url，但是无法处理行间属性的链接，比如
      // <img src='./assets/images/xiaoxiao.jpeg' alt='' />
      {
        include: [appSrc],
        test: /\.(png|jpg|jpeg|gif|svg|webp)$/, // 匹配图片文件
        type: 'asset', // type选择asset
        parser: {
          dataUrlCondition: {
            maxSize: 10 * 1024, // 小于10kb转base64位
          },
        },
        // 图片为啥需要 contenthash？直接使用[name][ext]不行吗？
        // 比如一张图片叫 person.jpeg，打包碗也是这个名字，用户访问了这个图片缓存了
        // 第二天前端用一张新图片person.jpeg替换了老的person.jpeg，名字没变，
        // 那么用户就还在读取之前的缓存，新的图片加载不出来，或者很多天以后才加载出来
        generator: {
          filename: 'static/images/[name].[contenthash:8][ext]', // 文件输出目录和命名
        },
      },
      // 匹配字体
      {
        test: /\.(woff2?|eot|ttf|otf)$/, // 匹配字体图标文件
        type: 'asset', // type选择asset
        parser: {
          dataUrlCondition: {
            maxSize: 10 * 1024, // 小于10kb转base64位
          },
        },
        generator: {
          filename: 'static/fonts/[name][contenthash:8][ext]', // 文件输出目录和命名
        },
      },
      {
        test: /\.(mp4|webm|ogg|mp3|wav|flac|aac)$/, // 匹配媒体文件
        type: 'asset', // type选择asset
        parser: {
          dataUrlCondition: {
            maxSize: 10 * 1024, // 小于10kb转base64位
          },
        },
        generator: {
          filename: 'static/media/[name][contenthash:8][ext]', // 文件输出目录和命名
        },
      },
    ],
  },
  /**
   * extensions是webpack的resolve解析配置下的选项，在引入模块时不带文件后缀时，
   * 会来该配置数组里面依次添加后缀查找文件，因为ts不支持引入以 .ts, tsx为后缀的文件，
   * 所以要在extensions中配置，而第三方库里面很多引入js文件没有带后缀，所以也要配置下js
   * 修改webpack.base.js，注意把高频出现的文件后缀放在前面
   */
  resolve: {
    extensions: ['.js', '.tsx', '.ts'],
    alias: {
      // 这个配置，在css里也生效
      '@': path.join(__dirname, '../src'),
    },
  },
  plugins: [
    new HtmlWebpackPlugin({
      title: 'fdy-react-single-cli',
      template: path.resolve(__dirname, '../public/index.html'), // 模板取定义root节点的模板
      inject: true, // 自动注入静态资源
      // https://github.com/jantimon/html-webpack-plugin/blob/main/examples/template-parameters/webpack.config.js
      templateParameters: (compilation, assets, assetTags, options) => {
        const list = Object.keys(compilation.assets).map(item =>
          path.join(assets.publicPath, item)
        );

        const preloadLinks = list
          .filter(item => item.indexOf('.preload.') > -1)
          .map(item => {
            return {
              rel: 'preload',
              as: 'image',
              href: item,
            };
          });

        const prefetchLinks = list
          .filter(item => item.indexOf('.prefetch.') > -1)
          .map(item => {
            return {
              rel: 'prefetch',
              as: 'image',
              href: item,
            };
          });

        return {
          compilation,
          webpackConfig: compilation.options,
          htmlWebpackPlugin: {
            tags: assetTags,
            files: assets,
            options: {
              ...options,
              preloadLinks,
              prefetchLinks,
            },
          },
        };
      },
    }),

    //  现在不需要这个插件，就可以直接使用了
    // new webpack.DefinePlugin({
    //   'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
    // }),
  ],
};
