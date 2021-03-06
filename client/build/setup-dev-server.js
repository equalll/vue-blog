const path = require('path')
const webpack = require('webpack')
const MFS = require('memory-fs')
const clientConfig = require('./webpack.client.config')
const serverConfig = require('./webpack.server.config')

module.exports = function setupDevServer (app, cb) {
  let bundle
  let template

  const clientCompiler = webpack(clientConfig)
  const devMiddleware = require('./koa2/dev.js')(clientCompiler, {
    publicPath: clientConfig.output.publicPath,
    stats: {
      colors: true
    },
    //noInfo: true
  })
  app.use(devMiddleware)

  
  clientCompiler.plugin('done', () => {
    const fs = devMiddleware.fileSystem
    const filePath = path.join(clientConfig.output.path, 'front.html')
    console.log("clientPath",serverConfig.output.path)
    if (fs.existsSync(filePath)) {
      template = fs.readFileSync(filePath, 'utf-8')
      if (bundle) {
        console.log('ok')
        cb(bundle, template)
      }
    }
  })

  // hot middleware
  app.use(require('./koa2/hot.js')(clientCompiler))

  //console.log(serverConfig)
  // watch and update server renderer
  const serverCompiler = webpack(serverConfig)
  const mfs = new MFS()
  serverCompiler.outputFileSystem = mfs
  serverCompiler.watch({}, (err, stats) => {
    if (err) throw err
    stats = stats.toJson()
    stats.errors.forEach(err => console.error(err))
    stats.warnings.forEach(err => console.warn(err))

    console.log("serverPath",serverConfig.output.path)
    // read bundle generated by vue-ssr-webpack-plugin
    const bundlePath = path.join(serverConfig.output.path, 'vue-ssr-server-bundle.json')
    bundle = JSON.parse(mfs.readFileSync(bundlePath, 'utf-8'))
    if (template) {
      console.log('ok')
      cb(bundle, template)
    }
  })
}
