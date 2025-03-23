<template>
  <v-card>
    <v-card-text>
      <v-container>
        <v-row>
          <v-col>
            <v-chart class="chart" :option="chartOptions" autoresize />
          </v-col>
        </v-row>
      </v-container>
    </v-card-text>
  </v-card>
</template>

<script setup>
import { use } from 'echarts/core';
import { LineChart } from 'echarts/charts';
import { GridComponent, TooltipComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import VChart from 'vue-echarts';
import { ref, computed } from 'vue';

use([LineChart, GridComponent, TooltipComponent, CanvasRenderer]);

// Props
const props = defineProps({
  elevationData: {
    type: Array,
    required: true
  }
});
console.log(typeof props.elevationData)
console.log(props.elevationData)
console.log(Array.isArray(props.elevationData))
const a = props.elevationData
          .filter((p) => p.elevation !== null && p.elevation !== undefined)  // Filter out points with no elevation
          .map((p) => [
            p.distance_along_line,  // Assuming 'distance_along_line' exists
            p.elevation,            // Assuming 'elevation' exists
          ])
console.log(a)
// Compute chart options
const chartOptions = computed(() => ({
  tooltip: {
    trigger: 'axis',
    formatter: (params) => {
      const { data } = params[0];
      return `Distance: ${data[0]} km<br>Elevation: ${data[1]} m`;
    }
  },
  xAxis: {
    type: 'value',
    name: 'Distance (km)',
  },
  yAxis: {
    type: 'value',
    name: 'Elevation (m)',
  },
  series: [
    {
      type: 'line',
      name: 'Elevation',
        data: props.elevationData
          .filter((p) => p.elevation !== null && p.elevation !== undefined)  // Filter out points with no elevation
          .map((p) => [
            p.distance_along_line,  // Assuming 'distance_along_line' exists
            p.elevation,            // Assuming 'elevation' exists
          ]),
      lineStyle: { color: '#3b82f6' },
      smooth: true
    }
  ]
}));
</script>

<style scoped>
.chart {
  height: 300px;
}
</style>
