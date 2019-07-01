#!/bin/bash
workspace=$(cd $(dirname $0) && pwd -P)
cd $workspace
module="kaochong-jp"
node_path=/root/.nvm/versions/node/v8.11.4
gitversion=RELEASE
control=./control.sh
action=$1


case $action in
  "prod")
      environment="prod"
  ;;
  "prev")
      environment="prev"
  ;;
  "test")
      environment="test"
  ;;
  *)
      environment="dev"
  ;;
esac

function get_dependency() {
    rm -rf .dependency
    mkdir .dependency
}

function build() {
    # 进行编译
    ${node_path}/bin/npm install
    mv ./ kaochong-jp/
    echo -n "$app build ok, vsn="
    rm -rf $gitversion
    gitversion
}

function make_output() {
    # 新建output目录
    local output="./output"
    rm -rf $output &>/dev/null
    mkdir -p $output &>/dev/null

    # 填充output目录, output内的内容 即为 线上部署内容
    (
      find . -maxdepth 1  ! -path "./output"  ! -path "."  -exec cp -rf {} $output  \;  #适配打包代码发布
        echo -e "make output ok."
    ) || { echo -e "make output failed!"; exit 2; } # 填充output目录失败后, 退出码为 非0

}

## internals
function gitversion() {
    version=$(git status | sed -n '1p' | awk '{print $NF}')
    echo "Version: ${version}" >> $gitversion
    revision=$(git rev-parse HEAD)
    echo "Revision: ${revision}" >> $gitversion
    local gv=`cat $gitversion`
    echo "$gv"
}


##########################################
## main
## 其中,
##        1.下载依赖
##        2.编译
##        3.生成output目录
##        4.打包output
##########################################

# 1.进行编译
build

# 2.生成部署包output
make_output

# 编译成功
echo -e "build done."
exit 0
