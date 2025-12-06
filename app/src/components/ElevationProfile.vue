<template>
  <div ref="containerRef" class="chart-container">

    <div v-if="summary" class="summary-bar">
        <div title="Total distance of the route">
            <span class="label">Dist:</span>
            {{ (summary.totalDistance / 1000).toFixed(2) }} km
        </div>
        <div title="Total positive elevation gain">
            <span class="label">Ascent:</span>
            {{ summary.totalAscent.toFixed(0) }} m
        </div>
        <div title="Total negative elevation change">
            <span class="label">Descent:</span>
            {{ summary.totalDescent.toFixed(0) }} m
        </div>
        <div title="Highest point on the route">
            <span class="label">Max Elev:</span>
            {{ summary.maxElevation.toFixed(0) }} m
        </div>
    </div>

    <svg ref="svgRef" class="chart" role="img" aria-label="Elevation profile chart"></svg>

    <div ref="tooltipRef" class="tooltip" role="tooltip" aria-live="polite"></div>

    <div class="controls">
        <button
            v-if="isZoomed"
            @click="resetZoom"
            class="control-btn"
        >
            Full route
        </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, nextTick, computed } from 'vue';

// --- Modular D3 Imports ---
import { select, pointer } from 'd3-selection';
import { brushX } from 'd3-brush';
import { scaleLinear } from 'd3-scale';
import { line, area, curveMonotoneX, curveLinear } from 'd3-shape';
import { axisBottom, axisLeft } from 'd3-axis';
import { max, min, bisector } from 'd3-array';
import mapConfig from "@/config/mapConfig.js";
import { useElevationHover } from '@/composables/useElevationHover';

const { setHoveredPoint, clearHoveredPoint } = useElevationHover();
const d3 = {
    select, pointer, brushX,
    scaleLinear,
    line, area, curveMonotoneX, curveLinear,
    axisBottom, axisLeft,
    max, min, bisector
};

const props = defineProps({
  elevationData: {
    type: Array,
    required: true
  },
  pois: {
    type: Array,
    default: () => []
  },
  color: {
    type: String,
    default: mapConfig.mainColor
  },
  showGradient: {
    type: Boolean,
    default: true
  }
});


const svgRef = ref(null);
const tooltipRef = ref(null);
const containerRef = ref(null);

let resizeObserver = null;
let currentXDomain = ref(null);
const isZoomed = ref(false);

// --- Computed Data & Calculations ---

const processedData = computed(() => {
    const data = (props.elevationData || []).filter(d => d.elevation != null);
    if (data.length < 2) return data;

    let totalAscent = 0;
    let totalDescent = 0;

    const enrichedData = data.map((d, i) => {
        let grade = 0;
        if (i > 0) {
            const prev = data[i - 1];
            const distChange = d.distance_along_line - prev.distance_along_line;
            const elevChange = d.elevation - prev.elevation;

            if (distChange > 0) {
                grade = (elevChange / distChange) * 100;
            }

            if (elevChange > 0) {
                totalAscent += elevChange;
            } else {
                totalDescent += Math.abs(elevChange);
            }
        }
        return {
            ...d,
            grade: grade
        };
    });
    return {
        data: enrichedData,
        summary: {
            totalAscent: totalAscent,
            totalDescent: totalDescent,
            totalDistance: d3.max(data, d => d.distance_along_line) || 0,
            maxElevation: d3.max(data, d => d.elevation) || 0,
            minElevation: d3.min(data, d => d.elevation) || 0
        }
    };
});

const summary = computed(() => processedData.value.summary || null);
const chartData = computed(() => processedData.value.data || []);

// --- D3 Drawing Logic ---

const gradeColorScale = d3.scaleLinear()
    .domain([-15, -5, 0, 5, 10, 20])
    .range(['#059669', '#34d399', '#d2d0d0', '#fa9e15', '#ef4444', '#7f1d1d'])
    .clamp(true);

const resetZoom = () => {
    currentXDomain.value = null;
    isZoomed.value = false;
    drawChart();
};


const drawChart = () => {
  const data = chartData.value;
  if (!data.length || !containerRef.value) return;

  const containerWidth = containerRef.value.clientWidth;
  const width = containerWidth;
  const height = 120;
  const margin = {top: 10, right: 5, bottom: 30, left: 35};

  d3.select(svgRef.value).selectAll('*').remove();

  const svg = d3.select(svgRef.value)
      .attr('width', width)
      .attr('height', height);

  // 1. Scales
  const xDomain = currentXDomain.value || [0, d3.max(data, d => d.distance_along_line)];

  const x = d3.scaleLinear()
      .domain(xDomain)
      .range([margin.left, width - margin.right]);

  const visibleData = data.filter(d => d.distance_along_line >= xDomain[0] && d.distance_along_line <= xDomain[1]);

  const minElevation = d3.min(visibleData, d => d.elevation);
  const maxElevation = d3.max(visibleData, d => d.elevation);

  const y = d3.scaleLinear()
      .domain([minElevation, maxElevation])
      .nice()
      .range([height - margin.bottom, margin.top]);

  // 2. Generators
  const lineGenerator = d3.line()
      .x(d => x(d.distance_along_line))
      .y(d => y(d.elevation))
      .curve(d3.curveMonotoneX);


    // 3. Grade Visualization (Area) - Drawn as multiple segments
  if (props.showGradient) {
      for (let i = 0; i < data.length - 1; i++) {
      const d1 = data[i];
      const d2 = data[i + 1];

      const avgGrade = d2.grade;

      const segmentData = [d1, d2];

      const areaGenerator = d3.area()
          .x(d => x(d.distance_along_line))
          .y0(height - margin.bottom)
          .y1(d => y(d.elevation))
          .curve(d3.curveLinear);


      if (d1.distance_along_line >= xDomain[0] && d2.distance_along_line <= xDomain[1]) {
          svg.append('path')
              .datum(segmentData)
              .attr('fill', gradeColorScale(avgGrade))
              .attr('fill-opacity', 0.6)
              .attr('d', areaGenerator);
      }
  }
  }
      else
  {

    // 3. Area Visualization Grey (no percentages)

    for (let i = 0; i < data.length - 1; i++) {
      const d1 = data[i];
      const d2 = data[i + 1];
      const segmentData = [d1, d2];
      const areaGenerator = d3.area()
          .x(d => x(d.distance_along_line))
          .y0(height - margin.bottom)
          .y1(d => y(d.elevation))
          .curve(d3.curveLinear);

      if (d1.distance_along_line >= xDomain[0] && d2.distance_along_line <= xDomain[1]) {
        svg.append('path')
            .datum(segmentData)
            .attr('fill', 'grey')
            .attr('fill-opacity', 0.2)
            .attr('d', areaGenerator);
      }
    }
  }
  // 4. Draw line over the area
  svg.append('path')
      .datum(data)
      .attr('fill', 'none')
      .attr('stroke', props.color)
      .attr('stroke-width', 1)
      .attr('d', lineGenerator);

  // 5. POI markers
  if (props.pois.length) {
    svg.selectAll('.poi')
        .data(props.pois.filter(d => d.distance_along_line >= xDomain[0] && d.distance_along_line <= xDomain[1]))
        .enter()
        .append('circle')
        .attr('class', 'poi')
        .attr('cx', d => x(d.distance_along_line))
        .attr('cy', d => y(d.elevation))
        .attr('r', 4)
        .attr('fill', '#ef4444')
        .attr('stroke', 'white')
        .attr('stroke-width', 2);
  }

  // 6. Axes
  const xAxis = d3.axisBottom(x)
      .ticks(5)
      .tickFormat(d => (d / 1000) + 'km');

  const yAxis = d3.axisLeft(y).ticks(2).tickFormat(d => d + 'm');

  svg.append('g')
      .attr('transform', `translate(0,${height - margin.bottom})`)
      .call(xAxis)
      .call(g => g.select('.domain').remove())
      .call(g => g.selectAll('.tick line').attr('stroke-opacity', 0.5).attr('y2', 6));

  svg.append('g')
      .attr('transform', `translate(${margin.left},0)`)
      .call(yAxis)
      .call(g => g.select('.domain').remove())
      .call(g => g.selectAll('.tick line').attr('stroke-opacity', 0.5).attr('x2', -6));


// 7. Zoom Interaction (always active, cleanly separated)
const brush = d3.brushX()
    .extent([[margin.left, margin.top], [width - margin.right, height - margin.bottom]])
    .on('end', (event) => {
        if (!event.sourceEvent) return;
        if (!event.selection) return;

        const [x1, x2] = event.selection;
        currentXDomain.value = [x.invert(x1), x.invert(x2)];
        isZoomed.value = true;
        // Clear the brush selection
        d3.select(svgRef.value).select('.brush').call(brush.move, null);
        drawChart();
    });

const brushGroup = svg.append('g')
    .attr('class', 'brush')
    .call(brush);

// 8. Hover Interaction (always active, cleanly separated)
const crosshair = svg.append('line')
    .attr('class', 'crosshair')
    .attr('y1', margin.top)
    .attr('y2', height - margin.bottom)
    .attr('stroke', '#94a3b8')
    .attr('stroke-width', 1)
    .attr('stroke-dasharray', '4,4')
    .style('pointer-events', 'none')
    .style('display', 'none');

// Use the brush overlay for hover events
const brushOverlay = brushGroup.select('.overlay');
const bisect = d3.bisector(d => d.distance_along_line).left;

brushOverlay.on('mousemove', function (event) {
    const [mx] = d3.pointer(event);
    if (mx < margin.left || mx > width - margin.right) return;

    const xValue = x.invert(mx);
    const idx = Math.min(bisect(data, xValue), data.length - 1);
    const d = data[Math.max(0, idx)];

    if (d && tooltipRef.value && containerRef.value) {
        crosshair
            .attr('x1', x(d.distance_along_line))
            .attr('x2', x(d.distance_along_line))
            .style('display', null);

        const containerRect = containerRef.value.getBoundingClientRect();
        const tooltipX = event.clientX - containerRect.left + 15;
        const tooltipY = event.clientY - containerRect.top - 10;

        const grade = d.grade !== undefined ? d.grade : 0;
        const gradeColor = gradeColorScale(grade);

        const tooltip = d3.select(tooltipRef.value);
        tooltip.style('display', 'block')
            .style('left', `${tooltipX}px`)
            .style('top', `${tooltipY}px`)
            .html(`
              <div style="font-weight: 600;">Elevation: ${d.elevation.toFixed(0)} m</div>
              <div style="font-size: 11px; color: #64748b;">Distance: ${(d.distance_along_line / 1000).toFixed(2)} km</div>
              <div style="font-size: 11px; color: #64748b;">
                  Grade: <span style="font-weight: 700; color: ${gradeColor};">${grade.toFixed(1)}%</span>
              </div>
            `);

      // emit the data for the map!
        setHoveredPoint({
            distance: d.distance_along_line,
            elevation: d.elevation,
            grade: grade,
            lat: d.coordinates[1],  // Make sure your data has these
            lng: d.coordinates[0]
        });
    }
});

brushOverlay.on('mouseleave', () => {
    crosshair.style('display', 'none');
    if (tooltipRef.value) {
        d3.select(tooltipRef.value).style('display', 'none');
    }
    clearHoveredPoint();
});
};

onMounted(async () => {
  await nextTick();
  drawChart();

  if (containerRef.value) {
    resizeObserver = new ResizeObserver(() => {
      drawChart();
    });
    resizeObserver.observe(containerRef.value);
  }
});

onUnmounted(() => {
  if (resizeObserver) {
    resizeObserver.disconnect();
  }
});

let debounceTimeout = null;
watch(() => [props.elevationData, props.pois, props.color, currentXDomain.value], () => {
  clearTimeout(debounceTimeout);
  debounceTimeout = setTimeout(drawChart, 150);
}, { deep: true });
</script>

<style scoped>
.chart-container {
  position: relative;
  width: 100%;
}

.summary-bar {
  display: flex;
  justify-content: space-around;
  padding: 5px 0;
  background: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
  font-size: 12px;
  color: #4b5563;
}

.summary-bar .label {
  font-weight: 600;
}

.chart {
  width: 100%;
  display: block;
}

.tooltip {
  position: absolute;
  padding: 8px 12px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  pointer-events: none;
  display: none;
  font-size: 13px;
  z-index: 10;
  white-space: nowrap;
}

.controls {
  position: absolute;
  bottom: 35px;
  right: 10px;
  display: flex;
  gap: 8px;
  z-index: 20;
}

.control-btn {
  padding: 4px 8px;
  font-size: 11px;
  background: white;
  color: #374151;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  cursor: pointer;
}

.control-btn.zoom-active {
  background: #3b82f6;
  color: white;
}

:global(.tick text) {
  font-size: 10px;
  fill: #64748b;
}
</style>
