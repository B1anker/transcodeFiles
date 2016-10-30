/**
 * 修改文件编码格式，例如：GBK转UTF8
 * 支持多级目录
 * @param {String} [source_name] [需要进行转码的文件路径]
 * @param {Array}  [file_type] [需要进行转码的文件格式，比如html文件]
 * @param {String} [from_code] [文件的编码]
 * @param {String} [to_code]   [文件的目标编码]
 */

// 引入包
const fs = require('fs');
const iconv = require('iconv-lite');
const jschardet = require("jschardet");
const readline = require('readline');

// 全局变量
let source_file_name = '',
  source_path = '',
  file_type = {
    'php': true,
    'css': true,
    'js': true,
    'css': true,
    'html': true,
    'htm': true,
    'sql': true
  },
  from_code = 'gb2312',
  target_path = '',
  target_code = 'utf8';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

/**
 * 判断元素是否在数组内
 * @date   2015-01-13
 * @param  {[String]}   elem [被查找的元素]
 * @return {[bool]}        [description]
 */


function removeFolder(path) {
  let folders = [];
  if (fs.existsSync(path)) {
    folders = fs.readdirSync(path);
    folders.forEach(function(folder) {
      let current_path = path + "/" + folder,
        stat = fs.lstatSync(current_path);
      if (stat.isDirectory()) {
        removeFolder(current_path)
      } else {
        fs.unlinkSync(current_path);
      }
    })
    fs.rmdirSync(path);
  }
}

function createFolder(target_path) {
  fs.mkdirSync(target_path, function(err) {
    err && console.error(err);
  });
}

function copyFile(file_source_path, file_target_path) {
  // fs.createReadStream(file_source_path).pipe(fs.createWriteStream(file_target_path));
  fs.writeFileSync(file_target_path, fs.readFileSync(file_source_path));
}

function encodeFile(file_target_path, file_data, origin_code) {
  fs.writeFileSync(file_target_path, iconv.decode(file_data, origin_code), {
    encoding: target_code
  }, function(err) {
    if (err) {
      throw err;
    }
  });
}

function createFile(file_source_path, file_target_path) {
  var name = file_source_path.toString();
  if (!file_type[name.substring(name.lastIndexOf('.') + 1)]) {
    copyFile(file_source_path, file_target_path);
    return;
  }
  copyFile(file_source_path, file_target_path);
  let file_data = fs.readFileSync(file_target_path);
  let info = jschardet.detect(file_data);
  let origin_code = info.encoding;
  if (origin_code == 'ISO-8859-2') {
    origin_code = 'GB2312'
  }
  // if (!(origin_code == 'UTF-8' || origin_code == 'GB2312')) {
  //   console.log(origin_code, file_target_path)
  // }
  encodeFile(file_target_path, file_data, origin_code);
}

/**
 * 转码函数
 * @date   2015-01-13
 * @param  {[String]}   root [编码文件目录]
 * @return {[type]}        [description]
 */
function transcodeFiles(source_path, target_path) {
  "use strict";
  createFolder(target_path);
  var files = fs.readdirSync(source_path);
  files.forEach(function(file_name) {
    let file_source_path = source_path + '/' + file_name,
      stat = fs.lstatSync(file_source_path);
    if (stat.isFile()) {
      let file_target_path = target_path + '/' + file_name
      createFile(file_source_path, file_target_path);
    } else {
      let file_target_path = target_path + '/' + file_name;
      transcodeFiles(file_source_path, file_target_path);
      //target_path = target_path.slice(0, target_path.lastIndexOf('/'))
    }
  });
}


function main() {
  rl.question(`What's your folder's name?\n`,
    (source_file_name) => {
      rl.close();
      source_path = './' + source_file_name;
      target_path = './' + source_file_name + '-output';
      fs.existsSync(target_path) && removeFolder(target_path);
      transcodeFiles(source_path, target_path);
    });
}
main()
