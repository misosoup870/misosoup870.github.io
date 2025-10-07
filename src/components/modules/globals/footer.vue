<script setup>
import {useRoute} from "vue-router";

const route = useRoute();
</script>

<template>
  <div v-if="route.path !== '/'" class="mt-6">
    <router-link to="/">
      <a>< Go back home</a>
    </router-link>
  </div>
</template>
