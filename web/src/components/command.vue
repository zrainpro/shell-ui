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
    name: "command",
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
      new Terminal({
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
              } else {
                this.callback && this.callback({
                  output: result.stdout,
                  error: result.stderr,
                  running: result.running
                });
              }
            } catch (e) {
              console.error(e);
            }
          };

          this.ws.onclose = function() {
          }
        });
      },
      async exec(value, path, callback) {
        // const result = await this.apiPost('/api/exec', { command: value, path });
        this.ws.send(JSON.stringify({ command: value, path, uuid: this.uuid }));
        this.callback = callback;
      }
    }
  }
</script>

<style lang="less">
  .zr-terminal {
    min-height: 20px;
    background-color: #2c3e50;
  }
  .zr-terminal-input {
    height: 20px;
    width: 100%;
    display: flex;
    flex-direction: row;
    justify-content: flex-start;
    align-items: flex-start;
    padding: 0 30px;
  }
  .zr-terminal-input .zr-terminal-path {
    height: 100%;
    padding-right: 20px;
    color: chocolate;
  }
  .zr-terminal-input input {
    width: 100%;
    height: 100%;
    background-color: #2c3e50;
    border: none;
    color: #1da57a;
    border-radius: 0;
  }
  .zr-terminal-input input:focus {
    outline: none;
    background-color: #354960;
  }
  .zr-terminal-log {
    min-height: 100px;
    height: 174px;
    background-color: #2c3e50;
    color: #42b983;
    padding-top: 40px;
    position: relative;
  }
  .zr-terminal-log .zr-terminal-log-header {
    height: 40px;
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    background-color: #1e1e1e;
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    padding: 10px 30px 0 30px;
    cursor: row-resize;
  }
  .zr-inline {
    display: flex;
    flex-direction: row;
    justify-content: flex-start;
    align-items: center;
    height: 100%;
    cursor: unset;
  }
  .zr-icon {
    width: 100%;
    height: 100%;
    border-radius: 2px;
    fill: #e4f5ef;
  }
  .zr-btn {
    cursor: pointer;
    display: flex;
    justify-content: center;
    align-items: center;
  }
  .zr-btn:hover {
    background-color: rgb(66, 185, 131);
  }
  .zr-btn + .zr-btn {
    margin-left: 8px;
  }
  .zr-tooltip {
    position: relative;
  }
  .zr-tooltip:hover::before {
    content: attr(title);
    width: max-content;
    max-width: 300px;
    padding: 10px;
    background-color: rgba(53, 73, 96, 0.8);
    color: #ffffff;
    position: absolute;
    right: 0;
    bottom: 30px;
    z-index: 1;
  }
  .zr-tooltip:hover::after {
    content: '';
    width: 0;
    height: 0;
    border: 5px solid rgba(53, 73, 96, 0.8);
    border-left-color: transparent;
    border-top-color: transparent;
    transform: rotate(45deg);
    position: absolute;
    right: 8px;
    bottom: 25px;
    z-index: 1;
  }
</style>