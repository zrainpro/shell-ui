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
        username: ''
      }
    },
    async mounted() {
      if (!this.homedir) {
        const result = await this.apiGet('/api/homedir');
        if (result.code === 200) {
          this.homedir = result.data.homedir;
          this.username = result.data.username;
        }
      }
      new Terminal({
        el: this.$refs.command,
        homedir: this.homedir,
        username: this.username,
        log: 'welcome shell-ui',
        exec: this.exec.bind(this)
      });
    },
    methods: {
      async exec(value, path) {
        const result = await this.apiPost('/api/exec', { command: value, path });
        return {
          output: result.data.stdout,
          error: result.data.stderr
        };
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
  }
  .zr-inline {
    display: flex;
    flex-direction: row;
    justify-content: flex-start;
    align-items: center;
    height: 100%;
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
</style>