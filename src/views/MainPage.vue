<template>
    <v-container>
      <MainComponent 
      :isAdmin="false"
      />
    </v-container>
  </template>
  
  <script>
  import MainComponent from '@/components/MainComponent.vue';
  
  export default {
    components: {
      MainComponent
    }
  };
  </script>