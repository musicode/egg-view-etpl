'use strict'

const fs = require('fs')
const path = require('path')
const etpl = require('./etpl')

module.exports = app => {

  const engineConfig = {

    // 清除命令标签前后的空白字符
    strip: true,

    namingConflict: 'override',

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

    renderView(name, data) {
      return new Promise(resolve => {

        fs.stat(name, (err, stat) => {

          if (err) {
            return
          }

          const { mtimeMs } = stat
          const result = cache[ name ]
          if (!result || mtimeMs > result.mtimeMs) {
            fs.readFile(name, 'utf8', (err, content) => {

              if (err) {
                return
              }

              cache[ name ] = {
                render: engineInstance.compile(content),
                mtimeMs: mtimeMs
              }

              resolve(
                cache[ name ].render(data)
              )

            })
          }
          else {
            resolve(
              cache[ name ].render(data)
            )
          }

        })

      })
    }

    async renderString(tpl, data) {
      return engineInstance.compile(tpl)(data)
    }

  }

  app.view.use('etpl', EtplView)

}
