'use strict'

const fs = require('mz/fs')
const etpl = require('etpl')

module.exports = app => {

  const engineConfig = {

    // 清除命令标签前后的空白字符
    strip: true,

    // target 或 master 名字冲突时的处理策略
    // 冲突必须报错，否则出了问题太难搞
    namingConflict: 'error',

  }

  let engine
  let filters

  if (app.config.etpl) {
    engine = app.config.etpl.engine
    filters = app.config.etpl.filters
    if (engine) {
      Object.assign(engineConfig, engine)
    }
  }

  // 根据配置实例化
  const engineInstance = new etpl.Engine(engineConfig)

  // 添加过滤函数
  if (filters) {
    for (let name in filters) {
      engineInstance.addFilter(name, filters[ name ])
    }
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
