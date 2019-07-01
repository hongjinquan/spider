#!/bin/sh

# init
WORKSPACE=`cd $(dirname $0);pwd`
cd ${WORKSPACE}
APP="kaochong-jp"
TIMEOUT="6"

SYSUSER=${USER}
USER="kaochong"
node_path=/home/kaochong/.tnvm/versions/alinode/v3.11.6/

# params
ACTION=${1}

# user: kaochong
user() {
    if [[ ${USER} != ${SYSUSER} ]];then
  echo "current user: ${SYSUSER}, please use user: ${USER}, exit."
  exit 1
    fi
}

# start
start() {
    ${node_path}/bin/npm run start:release
    sleep 3
}



# stop
stop() {
    local pid=$(getPID)
    if [ -z ${pid} ]; then
        echo "[ERROR] ${APP} not runnning."
        exit 0
    fi
    let kwait=${TIMEOUT}
    count=0;
    until [ `ps -p ${pid} | grep -c ${pid}` = '0' ] || [ $count -gt $kwait ]
    do
      echo "[INFO] waiting for processes to exit"
      kill ${pid}
      sleep 1
      let count=$count+1;
    done
    if [ $count -gt $kwait ];then
      echo "[INFO] killing processes [${APP}] after ${TIMEOUT} seconds"
      kill -9 ${pid} > /dev/null 2>&1
    fi
    echo "[INFO] stop ${APP}.jar successful."
}

# get pid
getPID() {
    pid=`ps aux | grep "node" | grep -v grep | awk '{print $2}'`
    if [ -z ${pid} ]; then
        echo ""
    fi
    echo ${pid}
}

# status
status() {
    local pid=$(getPID)
    if [[ -z $pid ]];then
        echo "[WARN] ${APP}.jar not running."
    else
        echo "[INFO] ${APP}.jar running, pid: ${pid}"
    fi
}

# restart
restart() {
    local pid=$(getPID)
    if [ -z ${pid} ]; then
        echo "[ERROR] ${APP}.jar not runnning."
        start
    else
        stop
        sleep 1
        start
    fi
}

# display
display() {
    echo "usage: sh kcontrol.sh [start|stop|restart|status]"
}



case ${ACTION} in
    "start")
  user
        start;;
    "stop")
  user
        stop;;
    "restart")
  user
        restart;;
    "status")
  user
        status;;
    *)
        display;;
esac
