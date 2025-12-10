<template>
    <div >
      <v-breadcrumbs :items="breadcrumbItems" class="breadcrumb">
        <template #item="{ item }">
          <v-breadcrumbs-item
              :disabled="item.disabled"
              @click="item.onClick && item.onClick()"
              class="cursor-pointer"
          >
            {{ item.title }}
          </v-breadcrumbs-item>
        </template>

<!--        <template #prepend>-->
<!--          <v-icon icon="$home"/>-->
<!--        </template>-->
      </v-breadcrumbs>
    </div>

</template>

<script setup>
import {useRouteInfoStore} from "@/stores/routestatus.js";
import { useMapHelpers} from '../composables/useMapLayers';

import {computed} from "vue";

const routeStatus = useRouteInfoStore();

function selectStepBreadcrumb() {
  routeStatus.setActiveTopic('route')
    alert(routeStatus.activeTopic)

};

function selectFeatureDetailBreadcrumb() {
  routeStatus.setActiveTopic('featuredetail')
  alert(routeStatus.activeTopic)
};

const breadcrumbItems = computed(() => {
  const topic = routeStatus.activeTopic;
  const kruimel = [
  {
    title: routeStatus.routeMetadata.title,
    disabled: true,
    onClick: () => routeStatus.setActiveTopic('overview'),
  }
  ]
  if (['route', 'featuredetail'].includes(topic)) {
    if (routeStatus.activeStepId) {
          kruimel.push( {
      title: routeStatus.activeStepData.title,
      disabled: true,
      onClick: () => selectStepBreadcrumb()
    })

    }
  }

    if (['featuredetail'].includes(topic)) {
      kruimel.push( {
        title: 'feature title',
        disabled: true,
        onClick: () => selectFeatureDetailBreadcrumb
      })
    }
    return kruimel
})


</script>

<style scoped>
.breadcrumb {
  justify-content: left;
;
}
</style>
