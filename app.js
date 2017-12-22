'use strict'

var path = require('path')
const fs = require('mz/fs')
const etpl = require('./lib/etpl')

module.exports = app => {

  const engineConfig = {

    // 清除命令标签前后的空白字符
    strip: true,

    // target 或 master 名字冲突时的处理策略
    // 冲突必须报错，否则出了问题太难搞
    namingConflict: 'error',

  }

  const config = app.config.etpl
  const engine = config && config.engine
  const filterDir = config && config.filterDir
  const targetDir = config && config.targetDir

  if (engine) {
    Object.assign(engineConfig, engine)
  }
  const engineInstance = new etpl.Engine(engineConfig)

  if (filterDir) {
    fs.readdirSync(filterDir).forEach(
      fileName => {
        if (fileName !== '.' && fileName !== '..') {
          engineInstance.addFilter(
            path.basename(fileName, '.js'),
            require(path.join(filterDir, fileName))
          )
        }
      }
    )
  }

  if (targetDir) {
    fs.readdirSync(targetDir).forEach(
      fileName => {
        if (fileName !== '.' && fileName !== '..') {
          engineInstance.compile(
            fs.readFileSync(path.join(targetDir, fileName), 'utf8')
          )
        }
      }
    )
  }

  const cache = { }

  class EtplView {

    async render(name, data) {
      return await this.renderView(name, data)
    }

    async renderView(name, data) {
      const content = await fs.readFile(name, 'utf8')
      if (!cache[ name ]) {
        cache[ name ] = engineInstance.compile(content)
      }
      return cache[ name ](data)
    }

    async renderString(tpl, data) {
      return engineInstance.compile(tpl)(data)
    }

  }

  app.view.use('etpl', EtplView)

}
