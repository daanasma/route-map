<template>
    <v-chart class="chart" :option="chartOptions" autoresize />
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
console.log('elevation profile: props.elevationData', props.elevationData)
const a = props.elevationData
          .filter((p) => p.elevation !== null && p.elevation !== undefined)  // Filter out points with no elevation
          .map((p) => [
            p.distance_along_line,  // Assuming 'distance_along_line' exists
            p.elevation,            // Assuming 'elevation' exists
          ])
// Compute chart options
const chartOptions = computed(() => {
  const elevationValues = props.elevationData
    .filter((p) => p.elevation !== null && p.elevation !== undefined)
    .map((p) => p.elevation);

  const minElevation = 0;
  const maxElevation = 170;
  const lineLength = props.elevationData[props.elevationData.length - 1].distance_along_line;
  return {
        animation: false, // Disable animation
    tooltip: {
      trigger: 'axis',
      formatter: (params) => {
        const { data } = params[0];
        return `Elevation: ${data[1]} m`;
      }
    },
    grid: {
    left: '3%',
    right: '4%',
    bottom: '3%',
      top: '4%',
      containLabel: true // Ensures labels don’t add extra padding
    },
    xAxis: {
      type: 'value',
      name: 'Distance (km)',
      axisLabel: {
        formatter: (value) => {
          // Check if the line length is greater than 3000 meters (3 km)
          if (lineLength > 5000) {
            return Math.round(value / 1000); // Convert to kilometers and remove decimals
          }
          return value; // Otherwise, keep it in meters with decimals
        }
    },
      boundaryGap: false
    },
    yAxis: {
      type: 'value',
      min: minElevation, // Set dynamic min
      max: maxElevation, // Set dynamic max
            boundaryGap: false // Removes extra padding
    },
    series: [
      {
        type: 'line',
        name: 'Elevation',
        data: props.elevationData
          .filter((p) => p.elevation !== null && p.elevation !== undefined)
          .map((p) => [p.distance_along_line, p.elevation]),
        lineStyle: { color: '#3b82f6' },
        smooth: true,
        symbol: 'none'  // Removes marker points
      }
    ]
  };
});</script>

<style scoped>
.chart {
  height: 100px;
}
</style>
