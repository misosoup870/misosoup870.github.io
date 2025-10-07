<script setup>
import top from "./components/modules/globals/header.vue";
import fot from "./components/modules/globals/footer.vue";
</script>

<template>
  <div class="font-PP m-5">
    <top></top>
    <router-view></router-view>
    <fot></fot>
  </div>
</template>
