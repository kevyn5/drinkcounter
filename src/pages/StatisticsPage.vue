<template>
  <q-page padding>
    <div class="row justify-center">
      <div class="col-12 col-md-10 col-lg-8">
        <div class="q-mb-lg">
          <q-btn
            flat
            icon="arrow_back"
            label="Back"
            @click="$router.go(-1)"
            class="q-mb-md"
          />
          <h4 class="q-my-md">Statistics</h4>
        </div>

        <!-- Year Selection -->
        <div class="q-mb-lg">
          <q-select
            v-model="selectedYear"
            :options="availableYears"
            label="Year"
            outlined
            dense
            class="q-mb-md"
            style="max-width: 200px"
          />
        </div>

        <!-- Moving Average Controls -->
        <div class="q-mb-lg">
          <q-btn-toggle
            v-model="movingAverageType"
            :options="[
              { label: 'Raw Data', value: 'none' },
              { label: '3 Month Average', value: '3month' },
              { label: '7 Month Average', value: '7month' }
            ]"
            color="primary"
            outline
            dense
          />
        </div>

        <!-- Statistics Cards -->
        <div class="row q-gutter-md q-mb-lg">
          <div class="col-12 col-sm-6 col-md-3">
            <q-card class="bg-blue-1">
              <q-card-section>
                <div class="text-h6">{{ yearStats.totalDrinks }}</div>
                <div class="text-subtitle2">Total Drinks</div>
              </q-card-section>
            </q-card>
          </div>
          <div class="col-12 col-sm-6 col-md-3">
            <q-card class="bg-orange-1">
              <q-card-section>
                <div class="text-h6">{{ yearStats.totalCalories.toLocaleString() }}</div>
                <div class="text-subtitle2">Total Calories</div>
              </q-card-section>
            </q-card>
          </div>
          <div class="col-12 col-sm-6 col-md-3">
            <q-card class="bg-green-1">
              <q-card-section>
                <div class="text-h6">{{ yearStats.averageDrinksPerMonth.toFixed(1) }}</div>
                <div class="text-subtitle2">Avg Drinks/Month</div>
              </q-card-section>
            </q-card>
          </div>
          <div class="col-12 col-sm-6 col-md-3">
            <q-card class="bg-red-1" v-if="annualWeightGain">
              <q-card-section>
                <div class="text-h6">{{ annualWeightGain.kg }} kg</div>
                <div class="text-subtitle2">Potential Weight Gain</div>
              </q-card-section>
            </q-card>
          </div>
        </div>

        <!-- Histogram Chart -->
        <q-card class="q-mb-lg">
          <q-card-section>
            <div class="text-h6 q-mb-md">Monthly Consumption {{ movingAverageType !== 'none' ? `(${movingAverageLabels[movingAverageType]})` : '' }}</div>
            <div class="histogram-container" style="height: 400px; position: relative;">
              <canvas ref="chartCanvas"></canvas>
            </div>
          </q-card-section>
        </q-card>

        <!-- Monthly Details Table -->
        <q-card>
          <q-card-section>
            <div class="text-h6 q-mb-md">Monthly Details</div>
            <q-table
              :rows="monthlyTableData"
              :columns="tableColumns"
              row-key="month"
              flat
              :pagination="{ rowsPerPage: 12 }"
            >
              <template v-slot:body-cell-drinks="props">
                <q-td :props="props">
                  <span :class="getDrinksClass(props.value)">
                    {{ props.value }}
                  </span>
                </q-td>
              </template>
              <template v-slot:body-cell-weightGain="props">
                <q-td :props="props">
                  <span :class="getWeightGainClass(props.value)">
                    {{ props.value }} kg
                  </span>
                </q-td>
              </template>
            </q-table>
          </q-card-section>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script setup>
/* eslint-disable */
import { ref, computed, onMounted, watch, nextTick, onBeforeUnmount } from 'vue'
import { useDrinksStore } from '../stores/drinks-store'
import { usePersonalDataStore } from '../stores/personal-data-store'
import {
  Chart,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js'

// Register Chart.js components
Chart.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

const drinksStore = useDrinksStore()
const personalDataStore = usePersonalDataStore()

// Reactive data
const chartCanvas = ref(null)
const chart = ref(null) // Used in createChart and cleanup functions
const selectedYear = ref(new Date().getFullYear())
const movingAverageType = ref('none')

// Available years based on data
const availableYears = computed(() => {
  const years = new Set()
  const currentYear = new Date().getFullYear()

  // Add current year
  years.add(currentYear)

  // Add years from drink data
  Object.keys(drinksStore.drinkCounters).forEach(dateKey => {
    const year = parseInt(dateKey.split('/')[0])
    years.add(year)
  })

  return Array.from(years).sort((a, b) => b - a)
})

// Moving average labels
const movingAverageLabels = {
  'none': 'Raw Data',
  '3month': '3 Month Moving Average',
  '7month': '7 Month Moving Average'
}

// Get monthly data for selected year
const monthlyData = computed(() => {
  const data = []
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ]

  for (let month = 0; month < 12; month++) {
    const monthStats = drinksStore.getMonthStatistics(selectedYear.value, month + 1)

    data.push({
      month: months[month],
      monthIndex: month,
      drinks: monthStats.totalStandardDrinks,
      calories: monthStats.totalCalories,
      avgDrinksPerDay: monthStats.averageStandardDrinksPerDay,
      avgCaloriesPerDay: monthStats.averageCaloriesPerDay,
      weightGain: personalDataStore.getMonthlyWeightGain(monthStats)?.kg || 0
    })
  }

  return data
})

// Apply moving average
const processedData = computed(() => {
  if (movingAverageType.value === 'none') {
    return monthlyData.value
  }

  const windowSize = movingAverageType.value === '3month' ? 3 : 7
  const result = [...monthlyData.value]

  for (let i = 0; i < result.length; i++) {
    const start = Math.max(0, i - Math.floor(windowSize / 2))
    const end = Math.min(result.length, i + Math.ceil(windowSize / 2))

    let totalDrinks = 0
    let totalCalories = 0
    let totalWeightGain = 0
    let count = 0

    for (let j = start; j < end; j++) {
      totalDrinks += monthlyData.value[j].drinks
      totalCalories += monthlyData.value[j].calories
      totalWeightGain += monthlyData.value[j].weightGain
      count++
    }

    if (count > 0) {
      result[i] = {
        ...result[i],
        drinks: Math.round(totalDrinks / count),
        calories: Math.round(totalCalories / count),
        weightGain: Math.round((totalWeightGain / count) * 100) / 100,
        avgDrinksPerDay: Math.round((totalDrinks / count) / 30 * 100) / 100,
        avgCaloriesPerDay: Math.round((totalCalories / count) / 30)
      }
    }
  }

  return result
})

// Year statistics
const yearStats = computed(() => {
  const totalDrinks = processedData.value.reduce((sum, month) => sum + month.drinks, 0)
  const totalCalories = processedData.value.reduce((sum, month) => sum + month.calories, 0)
  const monthsWithData = processedData.value.filter(month => month.drinks > 0).length

  return {
    totalDrinks: Math.round(totalDrinks * 10) / 10,
    totalCalories,
    averageDrinksPerMonth: monthsWithData > 0 ? Math.round((totalDrinks / monthsWithData) * 10) / 10 : 0,
    averageCaloriesPerMonth: monthsWithData > 0 ? Math.round(totalCalories / monthsWithData) : 0
  }
})

// Annual weight gain projection
const annualWeightGain = computed(() => {
  if (!personalDataStore.isDataComplete()) return null

  const totalCalories = yearStats.value.totalCalories
  const caloriesPerKg = 7700
  const weightGainKg = totalCalories / caloriesPerKg

  return {
    kg: Math.round(weightGainKg * 100) / 100,
    pounds: Math.round((weightGainKg * 2.20462) * 100) / 100
  }
})

// Table data
const monthlyTableData = computed(() => {
  return processedData.value.map(month => ({
    month: month.month,
    drinks: month.drinks,
    calories: month.calories.toLocaleString(),
    avgDrinksPerDay: month.avgDrinksPerDay.toFixed(1),
    avgCaloriesPerDay: month.avgCaloriesPerDay.toLocaleString(),
    weightGain: month.weightGain.toFixed(2)
  }))
})

// Table columns
const tableColumns = [
  { name: 'month', label: 'Month', field: 'month', align: 'left' },
  { name: 'drinks', label: 'Total Drinks', field: 'drinks', align: 'center' },
  { name: 'calories', label: 'Total Calories', field: 'calories', align: 'center' },
  { name: 'avgDrinksPerDay', label: 'Avg Drinks/Day', field: 'avgDrinksPerDay', align: 'center' },
  { name: 'avgCaloriesPerDay', label: 'Avg Calories/Day', field: 'avgCaloriesPerDay', align: 'center' },
  { name: 'weightGain', label: 'Weight Gain', field: 'weightGain', align: 'center' }
]

// Styling functions
const getDrinksClass = (value) => {
  if (value > 60) return 'text-red text-weight-bold'
  if (value > 30) return 'text-orange text-weight-medium'
  if (value > 14) return 'text-yellow-8'
  return 'text-green'
}

const getWeightGainClass = (value) => {
  const numValue = parseFloat(value)
  if (numValue > 0.5) return 'text-red text-weight-bold'
  if (numValue > 0.2) return 'text-orange text-weight-medium'
  return 'text-grey-7'
}

// Draw histogram chart with Chart.js
const createChart = () => {
  if (!chartCanvas.value) return

  // Destroy existing chart
  if (chart.value) {
    chart.value.destroy()
  }

  const ctx = chartCanvas.value.getContext('2d')
  const data = processedData.value

  chart.value = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: data.map(d => d.month),
      datasets: [
        {
          label: 'Standard Drinks',
          data: data.map(d => d.drinks),
          backgroundColor: 'rgba(25, 118, 210, 0.6)',
          borderColor: 'rgba(25, 118, 210, 1)',
          borderWidth: 1,
          yAxisID: 'y'
        },
        {
          label: 'Weight Gain (kg)',
          data: data.map(d => d.weightGain),
          backgroundColor: 'rgba(245, 124, 0, 0.6)',
          borderColor: 'rgba(245, 124, 0, 1)',
          borderWidth: 1,
          yAxisID: 'y1',
          type: 'line',
          fill: false,
          tension: 0.4
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: `${selectedYear.value} Consumption Statistics ${movingAverageType.value !== 'none' ? `(${movingAverageLabels[movingAverageType.value]})` : ''}`
        },
        legend: {
          display: true,
          position: 'top'
        },
        tooltip: {
          callbacks: {
            afterBody: function(context) {
              const index = context[0].dataIndex
              const monthData = data[index]
              return [
                `Calories: ${monthData.calories.toLocaleString()}`,
                `Avg Drinks/Day: ${monthData.avgDrinksPerDay.toFixed(1)}`,
                `Avg Calories/Day: ${monthData.avgCaloriesPerDay.toLocaleString()}`
              ]
            }
          }
        }
      },
      scales: {
        x: {
          title: {
            display: true,
            text: 'Month'
          }
        },
        y: {
          type: 'linear',
          display: true,
          position: 'left',
          title: {
            display: true,
            text: 'Standard Drinks',
            color: 'rgba(25, 118, 210, 1)'
          },
          ticks: {
            color: 'rgba(25, 118, 210, 1)'
          }
        },
        y1: {
          type: 'linear',
          display: true,
          position: 'right',
          title: {
            display: true,
            text: 'Weight Gain (kg)',
            color: 'rgba(245, 124, 0, 1)'
          },
          ticks: {
            color: 'rgba(245, 124, 0, 1)'
          },
          grid: {
            drawOnChartArea: false,
          },
        }
      }
    }
  })
}

// Watch for changes and redraw
watch([processedData, movingAverageType], () => {
  nextTick(() => {
    createChart()
  })
})

watch(selectedYear, () => {
  nextTick(() => {
    createChart()
  })
})

// Cleanup
const cleanup = () => {
  if (chart.value) {
    chart.value.destroy()
  }
}

// Initialize
onMounted(() => {
  drinksStore.initialize()
  personalDataStore.initialize()

  nextTick(() => {
    createChart()
  })
})

onBeforeUnmount(cleanup)

</script>

<style scoped>
.histogram-container {
  width: 100%;
  overflow-x: auto;
}

canvas {
  max-width: 100%;
  height: auto;
}

.q-table th {
  font-weight: 600;
}

.text-red {
  color: #f44336;
}

.text-orange {
  color: #ff9800;
}

.text-yellow-8 {
  color: #f9a825;
}

.text-green {
  color: #4caf50;
}

.text-grey-7 {
  color: #616161;
}
</style>
