/**
 * 引入包
 */
const fs = require('fs');
const iconv = require('iconv-lite');
const jschardet = require("jschardet");
const readline = require('readline');

let transcodeFiles = function() {
  /**
   * 修改文件编码格式，例如：GBK转UTF8
   * 支持多级目录
   * @param {String} [this.source_path] [需要进行转码的源文件路径]
   * @param {String} [this.target_path] [需要进行转码的目标文件路径]
   * @param {Array}  [this.file_type] [需要进行转码的文件格式，比如html文件]
   * @param {String} [this.to_code]   [文件的目标编码]
   */
  this.source_path = '';
  this.target_path = '';
  this.target_code = 'UTF-8';
  this.file_type = {
    'php': true,
    'css': true,
    'js': true,
    'css': true,
    'html': true,
    'htm': true,
    'sql': true
  }
  this.rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  this.init();
}

/**
 * 初始化
 */
transcodeFiles.prototype.init = function() {
  this.rl.question(`What's your folder's name?\n`, (source_file_name) => {
    this.rl.close();
    this.source_path = './' + source_file_name;
    if (!fs.existsSync(this.source_path)) {
      throw('Input error, please rerun it!');
      return;
    }
    this.target_path = './' + source_file_name + '-output';
    fs.existsSync(this.target_path) && this.removeFolder(this.target_path);
    console.time('a');
    this.transcoding(this.source_path, this.target_path);
    console.timeEnd('a');
  });
}

/**
 * 递归删除指定文件夹
 * 支持多级目录
 * @param {String} [path] [要删除的文件/文件夹]
 */
transcodeFiles.prototype.existsFolder = function(path) {
  return fs.existsSync(path);
}

/**
 * 递归删除指定文件夹
 * 支持多级目录
 * @param {String} [path] [要删除的文件/文件夹]
 */
transcodeFiles.prototype.removeFolder = function(path) {
  let self = this;
  let folders = [];
  if (fs.existsSync(path)) {
    folders = fs.readdirSync(path);
    folders.forEach(folder => {
      let current_path = path + "/" + folder,
        stat = fs.lstatSync(current_path);
      if (stat.isDirectory()) {
        self.removeFolder(current_path)
      } else {
        fs.unlinkSync(current_path);
      }
    })
    fs.rmdirSync(path);
  }
}

/**
 * 递归把文件转换编码
 * 支持多级目录
 * @param {String} [source_path] [源文件/文件夹路径]
 * @param {String} [target_path] [目标文件/文件夹路径]
 */
transcodeFiles.prototype.transcoding = function(source_path, target_path) {
  "use strict";
  let self = this;
  self.createFolder(target_path);
  let files = fs.readdirSync(source_path);
  files.forEach(function(file_name) {
    let file_source_path = source_path + '/' + file_name,
      stat = fs.lstatSync(file_source_path);
    if (stat.isFile()) {
      let file_target_path = target_path + '/' + file_name
      self.createFile(file_source_path, file_target_path);
    } else {
      let file_target_path = target_path + '/' + file_name;
      self.transcoding(file_source_path, file_target_path);
    }
  });
}

/**
 * 创建文件夹
 * @param {String} [source_path] [源文件/文件夹路径]
 */
transcodeFiles.prototype.createFolder = function(target_path) {
  fs.mkdirSync(target_path, function(err) {
    err && console.error(err);
  });
}

/**
 * 创建文件:先把文件从源路径复制到目标路径，然后再对目标文件进行转码
 * @param {String} [file_source_path] [源文件路径]
 * @param {String} [file_target_path] [目标文件路径]
 */
transcodeFiles.prototype.createFile = function(file_source_path, file_target_path) {
  var name = file_source_path.toString();
  if (!this.file_type[name.substring(name.lastIndexOf('.') + 1)]) {
    //不是预设格式的文件跳过
    this.copyFile(file_source_path, file_target_path);
    return;
  }
  this.copyFile(file_source_path, file_target_path);
  let file_data = fs.readFileSync(file_target_path);
  let info = jschardet.detect(file_data);
  let origin_code = info.encoding;
  if (origin_code == 'ISO-8859-2') {
    origin_code = 'GB2312'
  } else if (origin_code == this.target_code) {
    //本来就是utf-8编码的文件跳过
    return;
  }
  this.encodeFile(file_target_path, file_data, origin_code);
}

/**
 * 对文件转码
 * @param {String} [file_source_path] [源文件路径]
 * @param {String} [file_target_path] [目标文件路径]
 * @param {String} [origin_code] [目标编码]
 */
transcodeFiles.prototype.encodeFile = function(file_target_path, file_data, origin_code) {
  fs.writeFileSync(file_target_path, iconv.decode(file_data, origin_code), {
    encoding: this.target_code
  }, function(err) {
    if (err) {
      throw err;
    }
  });
}

/**
 * 复制文件
 * @param {String} [file_source_path] [源文件路径]
 * @param {String} [file_target_path] [目标文件路径]
 */
transcodeFiles.prototype.copyFile = function(file_source_path, file_target_path) {
  // fs.createReadStream(file_source_path).pipe(fs.createWriteStream(file_target_path));
  fs.writeFileSync(file_target_path, fs.readFileSync(file_source_path));
}

/**
 * 程序入口
 */
new transcodeFiles();
