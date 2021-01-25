<template>
  <div class="label">
    <span class="label-item" :style="`width: ${labelWidth}px`">{{name}}</span>
    <slot></slot>
  </div>
</template>

<script>
  export default {
    name: "Label",
    props: {
      name: {
        type: String,
        default: ''
      },
      labelWidth: {
        type: String || Number,
        default: 80
      }
    }
  }
</script>

<style lang="less" scoped>
  .label {
    display: flex;
    flex-direction: row;
    justify-content: flex-start;
    align-items: center;
    .label-item {
      display: inline-block;
      width: 80px;
      text-align: right;
      box-sizing: border-box;
      padding-right: 10px;
      color: #2c3e50;
      &:after {
        content: ':';
      }
    }
  }
</style>
