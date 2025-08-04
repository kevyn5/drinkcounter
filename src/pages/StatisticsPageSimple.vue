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
import { ref, computed, onMounted } from 'vue'
import { useDrinksStore } from '../stores/drinks-store'
import { usePersonalDataStore } from '../stores/personal-data-store'

const drinksStore = useDrinksStore()
const personalDataStore = usePersonalDataStore()

// Reactive data
const selectedYear = ref(new Date().getFullYear())

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

// Year statistics
const yearStats = computed(() => {
  const totalDrinks = monthlyData.value.reduce((sum, month) => sum + month.drinks, 0)
  const totalCalories = monthlyData.value.reduce((sum, month) => sum + month.calories, 0)
  const monthsWithData = monthlyData.value.filter(month => month.drinks > 0).length

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
  return monthlyData.value.map(month => ({
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

// Initialize
onMounted(() => {
  drinksStore.initialize()
  personalDataStore.initialize()
})

</script>

<style scoped>
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
