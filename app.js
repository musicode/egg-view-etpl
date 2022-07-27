'use strict'

const fs = require('fs/promises')
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

  const viewCache = { }
  let filterDirMtime = 0
  let targetDirMtime = 0

  const readMtime = async function (file) {
    const { mtimeMs } = await fs.stat(file)
    return mtimeMs
  }

  const readFilterDir = async function () {
    if (!filterDir) {
      return
    }
    const mtimeMs = await readMtime(filterDir)
    if (mtimeMs === filterDirMtime) {
      return
    }

    let files = await fs.readdir(filterDir)

    files
    .filter(function (fileName) {
      return fileName !== '.' && fileName !== '..'
    })
    .forEach(function (fileName) {
      engineInstance.addFilter(
        path.basename(fileName, '.js'),
        require(path.join(filterDir, fileName))
      )
    })

    filterDirMtime = mtimeMs

  }

  const readTargetDir = async function () {
    if (!targetDir) {
      return
    }
    const mtimeMs = await readMtime(targetDir)
    if (mtimeMs === targetDirMtime) {
      return
    }

    let files = await fs.readdir(targetDir)

    files = files.filter(function (fileName) {
      return fileName !== '.' && fileName !== '..'
    })

    for (let i = 0, len = files.length; i < len; i++) {
      const content = await fs.readFile(
        path.join(targetDir, files[i]),
        'utf8'
      )
      engineInstance.compile(content)
    }

    targetDirMtime = mtimeMs

  }

  class EtplView {

    async render(name, data) {
      return await this.renderView(name, data)
    }

    async renderView(name, data) {

      await readFilterDir()
      await readTargetDir()

      const mtimeMs = await readMtime(name)

      const result = viewCache[ name ]
      if (!result || mtimeMs !== result.mtimeMs) {
        const content = await fs.readFile(name, 'utf8')
        viewCache[ name ] = {
          render: engineInstance.compile(content),
          mtimeMs: mtimeMs
        }
      }

      return viewCache[ name ].render(data)

    }

    async renderString(tpl, data) {

      await readFilterDir()
      await readTargetDir()

      return engineInstance.compile(tpl)(data)

    }

  }

  app.view.use('etpl', EtplView)

}
