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
import {useRouteInfoStore} from "@repo/common";
import { useMapHelpers} from '../composables/useMapLayers';

import {computed} from "vue";

const routeStatus = useRouteInfoStore();

function selectStepBreadcrumb() {
  routeStatus.setActiveFeature(null);
  routeStatus.setActiveTopic('route')
};

function selectFeatureDetailBreadcrumb() {
  routeStatus.setActiveTopic('featuredetail')
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
        title: routeStatus.activeFeatureData[0].properties.title,
        disabled: true,
        onClick: () => selectFeatureDetailBreadcrumb()
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
