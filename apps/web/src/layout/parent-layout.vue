<template>
  <router-view />
</template>

<script setup lang="ts">
// 父路由布局组件，用于包含子路由
defineOptions({
  name: 'ParentLayout',
});
</script>
