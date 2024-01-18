<template>
  <div>
    <div ref="command"></div>
<!--    <div class="zr-terminal">-->
<!--      <div class="zr-terminal-log">-->

<!--      </div>-->
<!--      <div class="zr-terminal-input">-->
<!--        <input type="text">-->
<!--      </div>-->
<!--    </div>-->
  </div>
</template>

<script>
  import Terminal from '../utils/terminal';

  export default {
    name: "my-command",
    data() {
      return {
        homedir: '',
        username: '',
        uuid: ''
      }
    },
    async mounted() {
      // 建立 长链接
      await this.createSocket()

      // if (!this.homedir) {
      //   const result = await this.apiGet('/api/homedir');
      //   if (result.code === 200) {
      //     this.homedir = result.data.homedir;
      //     this.username = result.data.username;
      //   }
      // }
      this.terminal = new Terminal({
        el: this.$refs.command,
        homedir: this.homedir,
        username: this.username,
        log: 'welcome shell-ui',
        exec: this.exec.bind(this)
      });
    },
    beforeUnmount() {
      this.ws.close();
    },
    methods: {
      async createSocket() {
        return new Promise(resolve => {
          this.ws = new WebSocket( (location.protocol === 'http:' ? 'ws://' : 'wss://') + location.host + '/terminal');

          this.ws.onopen = () => {
            this.ws.send('hello shell-ui');
          };

          this.ws.onmessage = (evt) => {
            if (evt.data === 'hello shell-ui-serve') return
            try {
              const result = JSON.parse(evt.data);
              if (result.homedir || result.username) {
                this.homedir = result.homedir;
                this.username = result.username;
                this.uuid = result.uuid;
                resolve();
              } else if (this.type === 'tab') {
                this.callback && this.callback(result.data)
              } else {
                this.callback && this.callback({
                  output: result.stdout,
                  error: result.stderr,
                  running: result.running,
                  ...result,
                });
              }
            } catch (e) {
              console.error(e);
            }
          };

          this.ws.onclose = function() {
          }

          this.ws.onerror = () => {
          }
        });
      },
      async exec(value, path, callback, type = 'normal') {
        // const result = await this.apiPost('/api/exec', { command: value, path });
        this.send(JSON.stringify({ command: value, path, uuid: this.uuid, type }));
        this.callback = callback;
        this.type = type;
      },
      send(commendObj) {
        if (this.ws.readyState === 0) {
          // 连接中, 等待
          setTimeout(() => this.send(commendObj), 50);
        } else if (this.ws.readyState === 1) {
          // 打开状态, 正常发送
          this.ws.send(commendObj);
        } else {
          // 关闭中或者关闭了, 重新连接
          this.createSocket().then(() => {
            this.send(commendObj);
          })
        }
      },
      eval(command) {
        this.terminal.showLog();
        this.terminal.eval(command);
      }
    }
  }
</script>

<style lang="less">
</style>