<script setup>
const props = defineProps({
  link: String,
  title: String,
  info: String,
});
</script>

<template>
  <div class="m-3">
    <router-link :to="link">
      <div class="w-sm bg-white border border-gray-200 rounded-lg shadow-sm p-6  hover:bg-gray-100">
        <h2 class="text-2xl font-bold mb-2">{{ title }}</h2>
        <p class="font-normal text-gray-700">{{ info }}</p>
      </div>
    </router-link>
  </div>
</template>
