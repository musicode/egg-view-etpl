# egg-view-etpl

基于 etpl 3.2.0，有所改动，使过滤器支持传入非字符串类型。

## Install

```bash
$ npm i egg-view-etpl --save
```

## Usage

```js
// {app_root}/config/plugin.js
exports.etpl = {
  enable: true,
  package: 'egg-view-etpl',
};
```

## Configuration

```js
// {app_root}/config/config.default.js
exports.etpl = {
  // 引擎配置，参考 https://github.com/ecomfe/etpl/blob/master/doc/config.md
  engine: { },
  // 过滤器目录，会自动注册该目录下的所有 js 为过滤器，过滤器名称与文件名保持一致
  filterDir: '',
  // 模板片段目录，会自动注册该目录下的所有模板
  targetDir: '',
};
```

see [config/config.default.js](config/config.default.js) for more detail.

## Example

<!-- example here -->

## Questions & Suggestions

Please open an issue [here](https://github.com/eggjs/egg/issues).

## License

[MIT](LICENSE)
