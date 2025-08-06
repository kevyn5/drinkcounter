<template>
  <q-page class="q-pa-sm q-pa-md-md">
    <!-- Header with Layout Toggle -->
    <div class="q-mb-sm q-mb-md-md">
      <div class="row items-center justify-end">
        <div class="col-auto">
          <!-- Layout Toggle -->
          <q-btn-group flat class="q-mr-sm">
            <q-btn
              flat
              dense
              :icon="layoutStore.getLayoutMode() === 'auto' ? 'devices' : layoutStore.getLayoutMode() === 'mobile' ? 'phone_android' : 'desktop_windows'"
              :color="layoutStore.getLayoutMode() !== 'auto' ? 'primary' : 'grey-6'"
              @click="toggleLayout"
              size="sm"
            >
              <q-tooltip>
                Layout: {{ layoutStore.getLayoutMode() === 'auto' ? 'Auto' : layoutStore.getLayoutMode() === 'mobile' ? 'Mobile' : 'Desktop' }}
                <br>Click to switch
              </q-tooltip>
            </q-btn>
          </q-btn-group>
        </div>
      </div>
    </div>

    <!-- Main Content Container -->
    <div class="row q-col-gutter-md">
      <!-- Left Column: Calendar and Summary -->
      <div class="col-12 col-lg-8">
        <!-- Calendar Container -->
        <q-card class="q-mb-md">
          <q-card-section class="q-pa-sm q-pa-md-md">
            <q-date
              v-model="selectedDate"
              :options="optionsFn"
              @update:model-value="onDateSelect"
              :events="calendarEventDates"
              class="full-width drink-calendar"
              :landscape="$q.screen.gt.xs"
            />

            <!-- Calendar Legend (smaller for mobile) -->
            <div class="row q-gutter-xs q-mt-sm justify-center">
              <div class="row items-center">
                <div class="calendar-legend-dot bg-grey-4"></div>
                <span class="text-caption q-ml-xs text-grey-7">None</span>
              </div>
              <div class="row items-center">
                <div class="calendar-legend-dot bg-green-4"></div>
                <span class="text-caption q-ml-xs text-grey-7">1-4</span>
              </div>
              <div class="row items-center">
                <div class="calendar-legend-dot bg-orange-6"></div>
                <span class="text-caption q-ml-xs text-grey-7">5-8</span>
              </div>
              <div class="row items-center">
                <div class="calendar-legend-dot bg-red-6"></div>
                <span class="text-caption q-ml-xs text-grey-7">9-12</span>
              </div>
              <div class="row items-center">
                <div class="calendar-legend-dot bg-black"></div>
                <span class="text-caption q-ml-xs text-grey-7">12+</span>
              </div>
            </div>

            <!-- BAC Information for Selected Date -->
            <div v-if="calculateBAC && hasPersonalData" class="q-mt-md">
              <q-separator class="q-mb-md" />
              <div class="text-body2 q-mb-sm text-center">Today's Estimates ({{ formatSelectedDate.split(',')[0] }})</div>
              <div class="row q-gutter-md justify-center">
                <div class="col-auto text-center">
                  <div class="text-caption text-grey-6">Estimated BAC</div>
                  <div class="text-h6 text-weight-medium text-orange">
                    {{ calculateBAC.toFixed(3) }}%
                  </div>
                </div>
                <div class="col-auto text-center">
                  <div class="text-caption text-grey-6">Time to Clear</div>
                  <div class="text-h6 text-weight-medium text-blue">
                    {{ calculateClearanceTime }}
                  </div>
                </div>
              </div>
              <div class="text-caption text-grey-5 q-mt-sm text-center">
                *Estimates based on Widmark formula. Individual metabolism varies.
              </div>
            </div>
          </q-card-section>
        </q-card>

        <!-- Monthly Summary - Mobile Optimized -->
        <div v-if="currentMonthStats && (currentMonthStats.totalStandardDrinks > 0 || personalDataStore.isDataComplete())">
          <q-card class="bg-blue-1 q-mb-md">
            <q-card-section class="q-pa-sm q-pa-md-md">
              <div class="text-h6 q-mb-sm q-mb-md-md">
                <q-icon name="analytics" class="q-mr-xs" />
                This Month's Statistics
              </div>

              <!-- Mobile: 2 columns, Desktop: 4 columns -->
              <div class="row q-gutter-xs q-gutter-md-md">
                <div class="col-6 col-md-3">
                  <q-card class="bg-white q-pa-xs q-pa-sm-md">
                    <div class="text-caption text-grey-7">Total Drinks</div>
                    <div class="text-h6 text-primary text-weight-bold">{{ currentMonthStats.totalStandardDrinks }}</div>
                  </q-card>
                </div>

                <div class="col-6 col-md-3">
                  <q-card class="bg-white q-pa-xs q-pa-sm-md">
                    <div class="text-caption text-grey-7">Total Calories</div>
                    <div class="text-body1 text-orange text-weight-bold">{{ Math.round(currentMonthStats.totalCalories / 1000) }}k</div>
                  </q-card>
                </div>

                <div class="col-6 col-md-3">
                  <q-card class="bg-white q-pa-xs q-pa-sm-md">
                    <div class="text-caption text-grey-7">Avg/Day</div>
                    <div class="text-body1 text-green text-weight-bold">{{ currentMonthStats.averageStandardDrinksPerDay.toFixed(1) }}</div>
                  </q-card>
                </div>

                <div class="col-6 col-md-3">
                  <q-card class="bg-white q-pa-xs q-pa-sm-md">
                    <div class="text-caption text-grey-7">Drinking Days</div>
                    <div class="text-body1 text-purple text-weight-bold">{{ currentMonthStats.daysWithDrinks }}</div>
                  </q-card>
                </div>
              </div>

              <!-- Personal Data Integration - Mobile Optimized -->
              <div v-if="personalDataStore.isDataComplete()" class="q-mt-sm q-mt-md-md">
                <q-separator class="q-my-sm" />
                <div class="row q-gutter-xs q-gutter-md-md">
                  <div class="col-4 col-md-3">
                    <q-card class="bg-white q-pa-xs q-pa-sm-md">
                      <div class="text-caption text-grey-7">BMR</div>
                      <div class="text-body2 text-weight-bold text-blue">
                        {{ personalDataStore.getBMR() || 0 }}
                      </div>
                      <div class="text-caption text-grey-5">cal/day</div>
                    </q-card>
                  </div>

                  <div class="col-4 col-md-3">
                    <q-card class="bg-white q-pa-xs q-pa-sm-md">
                      <div class="text-caption text-grey-7">Month Avg %</div>
                      <div v-if="currentMonthCaloriePercentage" :class="['text-body2 text-weight-bold', getCaloriePercentageClass(currentMonthCaloriePercentage)]">
                        {{ currentMonthCaloriePercentage.toFixed(1) }}%
                      </div>
                      <div v-else class="text-body2">0%</div>
                    </q-card>
                  </div>

                  <div class="col-4 col-md-3">
                    <q-card class="bg-white q-pa-xs q-pa-sm-md">
                      <div class="text-caption text-grey-7">Weight Gain</div>
                      <div class="text-body2 text-weight-bold text-red">
                        {{ currentMonthWeightGain ? currentMonthWeightGain.kg : 0 }} kg
                      </div>
                    </q-card>
                  </div>

                  <div class="col-4 col-md-3">
                    <q-card class="bg-white q-pa-xs q-pa-sm-md">
                      <div class="text-caption text-grey-7">Annual</div>
                      <div v-if="currentMonthAnnualProjection" :class="['text-body2 text-weight-bold', getWeightGainClass(currentMonthAnnualProjection.kg)]">
                        {{ currentMonthAnnualProjection.kg }}kg/yr
                      </div>
                      <div v-else class="text-body2">0kg/yr</div>
                    </q-card>
                  </div>
                </div>
              </div>

              <!-- Health Warning - Mobile Optimized -->
              <div v-if="currentMonthAnnualProjection && currentMonthAnnualProjection.kg > 2" class="q-mt-sm">
                <q-banner dense class="bg-red-1 text-red">
                  <template v-slot:avatar>
                    <q-icon name="warning" size="sm" />
                  </template>
                  <div class="text-caption">
                    At current levels: {{ currentMonthAnnualProjection.kg }} kg/year gain
                  </div>
                </q-banner>
              </div>
            </q-card-section>
          </q-card>
        </div>
      </div>
    </div>

    <!-- Drink Counter FAB - Mobile Optimized -->
    <q-page-sticky position="bottom-right" :offset="[18, 18]">
      <q-btn
        fab
        icon="local_bar"
        color="primary"
        @click="openCounterDialog"
        :size="$q.screen.lt.md ? 'md' : 'lg'"
      >
        <q-badge
          v-if="currentDateCounter > 0"
          color="red"
          :label="currentDateCounter"
          floating
        />
      </q-btn>
    </q-page-sticky>

    <!-- All existing dialogs remain the same -->
    <!-- Counter Dialog -->
    <q-dialog v-model="showCounterDialog" persistent>
      <q-card style="min-width: 300px; max-width: 500px;">
        <q-card-section class="row items-center justify-between">
          <div class="text-h6">{{ formatSelectedDate }}</div>
          <q-btn
            flat
            round
            dense
            icon="close"
            color="primary"
            v-close-popup
          />
        </q-card-section>

        <!-- BAC Information in Dialog -->
        <q-card-section v-if="calculateBAC && hasPersonalData" class="q-pt-none">
          <q-separator class="q-mb-md" />
          <div class="text-subtitle2 q-mb-sm text-center text-weight-medium">Blood Alcohol Estimates</div>
          <div class="row q-gutter-lg justify-center">
            <div class="col-auto text-center">
              <div class="text-caption text-grey-6">Estimated BAC</div>
              <div class="text-h6 text-weight-medium text-orange">
                {{ calculateBAC.toFixed(3) }}%
              </div>
            </div>
            <div class="col-auto text-center">
              <div class="text-caption text-grey-6">Time to Clear</div>
              <div class="text-h6 text-weight-medium text-blue">
                {{ calculateClearanceTime }}
              </div>
            </div>
          </div>
          <div class="text-caption text-grey-5 q-mt-sm text-center">
            *Estimates based on Widmark formula. Individual metabolism varies.
          </div>
        </q-card-section>

        <q-card-section>
          <div class="row items-center justify-between q-mb-md">
            <div class="row items-baseline q-gutter-sm">
              <div class="text-h6 text-grey-7">Total Standard Drinks:</div>
              <div class="text-h4">{{ currentDateCounter }}</div>
            </div>
            <div class="q-gutter-sm">
              <q-btn
                round
                color="negative"
                icon="remove"
                @click="decrementCounter"
                :disable="currentDateCounter <= 0"
              />
              <q-btn
                round
                color="positive"
                icon="add"
                @click="incrementCounter"
              />
            </div>
          </div>

          <!-- Current Date Beverages -->
          <div v-if="currentDateBeverages.length > 0" class="q-mb-md">
            <div class="text-subtitle2 q-mb-sm">Today's Beverages</div>
            <div v-for="beverage in currentDateBeverages" :key="beverage.id" class="row items-center q-mb-xs">
              <div class="col">
                <span class="text-weight-medium">{{ beverage.name }}</span>
                <span class="text-caption text-grey-6 q-ml-sm">x{{ beverage.count }}</span>
              </div>
              <div class="col-auto">
                <q-btn
                  flat
                  round
                  color="positive"
                  icon="add"
                  size="sm"
                  @click="addSelectedBeverage(beverage.id)"
                  class="q-mr-xs"
                />
                <q-btn
                  flat
                  round
                  color="negative"
                  icon="remove"
                  size="sm"
                  @click="removeSelectedBeverage(beverage.id)"
                />
              </div>
            </div>
          </div>

          <!-- Beverage Selection -->
          <div class="q-mb-md">
            <q-select
              v-model="selectedBeverage"
              :options="beverageData"
              option-label="name"
              label="Add a beverage"
              filled
              clearable
            >
              <template v-slot:option="scope">
                <q-item v-bind="scope.itemProps">
                  <q-item-section>
                    <q-item-label>{{ scope.opt.name }}</q-item-label>
                    <q-item-label caption>{{ scope.opt.volume }} • {{ scope.opt.alcoholPercent }}% • {{ scope.opt.standardDrinks }} std drinks</q-item-label>
                  </q-item-section>
                </q-item>
              </template>
            </q-select>
          </div>

          <div class="text-center q-mb-md">
            <q-btn
              color="primary"
              label="Add Beverage"
              @click="() => addSelectedBeverage()"
              :disable="!selectedBeverage"
            />
          </div>

          <!-- Monthly Statistics Section -->
          <div v-if="currentMonthStats && currentMonthStats.totalStandardDrinks > 0" class="q-mt-lg">
            <q-separator class="q-mb-md" />

            <!-- Personal Data Integration - Daily Statistics moved to top -->
            <div v-if="hasPersonalData">
              <div class="text-h6 q-mb-md">Daily Statistics</div>

              <div class="row items-center q-mb-sm">
                <div class="col-6">BMR:</div>
                <div class="col-6 text-right text-weight-bold">
                  {{ personalDataStore.getBMR() }} cal/day
                  <q-tooltip class="bg-grey-8">
                    Basal Metabolic Rate - calories needed at rest
                  </q-tooltip>
                </div>
              </div>

              <div class="row items-center q-mb-sm">
                <div class="col-6">Today's Cal %:</div>
                <div class="col-6 text-right">
                  <span v-if="dailyAlcoholCaloriePercentage !== null" :class="getCaloriePercentageClass(dailyAlcoholCaloriePercentage)">
                    {{ dailyAlcoholCaloriePercentage.toFixed(1) }}%
                  </span>
                  <span v-else>0%</span>
                  <q-tooltip class="bg-grey-8">
                    Alcohol calories for {{ formatSelectedDate }}<br/>
                    vs daily needs: {{ personalDataStore.getDailyCalorieNeeds() }} cal/day
                  </q-tooltip>
                </div>
              </div>

              <div class="row items-center">
                <div class="col-6">Today's Calories:</div>
                <div class="col-6 text-right">
                  <span>{{ todaysCalories }} cal</span>
                  <q-tooltip v-if="todaysCalories > 0"
                    class="bg-grey-8">
                    Calories consumed from alcoholic beverages today<br/>
                    Based on beverage calorie content and drink counts
                  </q-tooltip>
                </div>
              </div>

              <q-separator class="q-my-md" />
            </div>

            <!-- Monthly Statistics moved below daily -->
            <div class="text-h6 q-mb-md">This Month's Statistics</div>

            <div class="row items-center q-mb-sm">
              <div class="col-6">Total Standard Drinks:</div>
              <div class="col-6 text-right text-weight-bold">{{ currentMonthStats.totalStandardDrinks }}</div>
            </div>

            <div class="row items-center q-mb-sm">
              <div class="col-6">Total Calories:</div>
              <div class="col-6 text-right text-weight-bold">{{ currentMonthStats.totalCalories.toLocaleString() }}</div>
            </div>

            <div class="row items-center q-mb-sm">
              <div class="col-6">Average per Day:</div>
              <div class="col-6 text-right text-weight-bold">{{ currentMonthStats.averageStandardDrinksPerDay.toFixed(1) }}</div>
            </div>

            <div class="row items-center q-mb-sm">
              <div class="col-6">Days with Drinks:</div>
              <div class="col-6 text-right text-weight-bold">{{ currentMonthStats.daysWithDrinks }}</div>
            </div>

            <!-- Monthly personal data calculations -->
            <div v-if="hasPersonalData">
              <div class="row items-center q-mb-sm">
                <div class="col-6">Month Avg Cal %:</div>
                <div class="col-6 text-right">
                  <span v-if="alcoholCaloriePercentage" :class="getCaloriePercentageClass(alcoholCaloriePercentage)">
                    {{ alcoholCaloriePercentage.toFixed(1) }}%
                  </span>
                  <span v-else>0%</span>
                  <q-tooltip v-if="alcoholCaloriePercentage" class="bg-grey-8">
                    Monthly average alcohol calorie percentage<br/>
                    Based on your TDEE of {{ personalDataStore.getDailyCalorieNeeds() }} calories/day<br/>
                    (BMR: {{ personalDataStore.getBMR() }} × 1.375 activity factor)
                  </q-tooltip>
                </div>
              </div>

              <div class="row items-center">
                <div class="col-6">Weight Gain (This Month):</div>
                <div class="col-6 text-right">
                  <span v-if="monthlyWeightGain">{{ monthlyWeightGain.kg }} kg</span>
                  <span v-else>0 kg</span>
                  <q-tooltip v-if="monthlyWeightGain && monthlyWeightGain.kg > 0"
                    class="bg-grey-8">
                    {{ monthlyWeightGain.calories }} excess calories this month<br/>
                    ({{ monthlyWeightGain.caloriesPerDay.toFixed(0) }} calories/day average)<br/><br/>
                    Based on: 7700 calories = 1 kg fat
                  </q-tooltip>
                </div>
                <!-- kg/year projection kept underneath monthly statistics -->
                <div v-if="annualWeightGainProjection && annualWeightGainProjection.kg > 2" class="text-caption q-mt-xs">
                  <div class="text-red">
                    <q-icon name="warning" class="q-mr-xs" />
                    <span class="text-weight-medium">{{ annualWeightGainProjection.kg }} kg/year</span> if maintained
                    <q-tooltip class="bg-red-8">
                      At current consumption levels, you could gain<br/>
                      {{ annualWeightGainProjection.kg }} kg ({{ (annualWeightGainProjection.kg * 2.2).toFixed(1) }} lbs) in a year.<br/><br/>
                      This is {{ annualWeightGainProjection.calories.toLocaleString() }} excess calories annually.
                    </q-tooltip>
                  </div>
                </div>
                <div v-else-if="annualWeightGainProjection && annualWeightGainProjection.kg > 0.5" class="text-caption text-orange q-mt-xs">
                  <q-icon name="info" class="q-mr-xs" />
                  <span class="text-weight-medium">{{ annualWeightGainProjection.kg }} kg/year</span> projection
                  <q-tooltip class="bg-orange-8">
                    At current consumption levels, potential<br/>
                    annual weight gain: {{ annualWeightGainProjection.kg }} kg<br/>
                    ({{ (annualWeightGainProjection.kg * 2.2).toFixed(1) }} lbs)
                  </q-tooltip>
                </div>
              </div>
            </div>
          </div>
        </q-card-section>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useDrinksStore } from 'src/stores/drinks-store'
import { usePersonalDataStore } from 'src/stores/personal-data-store'
import { useLayoutStore } from 'src/stores/layout-store'
import { date } from 'quasar'

// Store instances
const drinksStore = useDrinksStore()
const personalDataStore = usePersonalDataStore()
const layoutStore = useLayoutStore()

// Initialize layout store
onMounted(() => {
  layoutStore.initialize()
})

// Toggle layout function
const toggleLayout = () => {
  const currentMode = layoutStore.getLayoutMode()
  const modes = ['auto', 'desktop', 'mobile']
  const currentIndex = modes.indexOf(currentMode)
  const nextMode = modes[(currentIndex + 1) % modes.length]

  layoutStore.setLayoutMode(nextMode)

  // Force page refresh to apply new layout
  window.location.reload()
}

// Reactive state
const selectedDate = ref(date.formatDate(new Date(), 'YYYY/MM/DD'))
const selectedBeverage = ref(null)
const showCounterDialog = ref(false)
const customBeverage = ref({
  name: '',
  volume: '',
  alcoholPercent: 0,
  standardDrinks: 0,
  calories: 0,
  description: '',
  type: 'Custom'
})

// Computed properties
const beverageData = computed(() => drinksStore.beverages)

const optionsFn = computed(() => {
  return (date) => {
    const today = new Date()
    const checkDate = new Date(date)
    return checkDate <= today
  }
})

const currentDateBeverages = computed(() => {
  const drinks = drinksStore.getDateBeverages(selectedDate.value)
  return drinks
})

const currentDateCounter = computed(() => {
  return drinksStore.getDrinkCount(selectedDate.value)
})

const currentMonthStats = computed(() => {
  const currentDate = new Date(selectedDate.value)
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth() + 1
  return drinksStore.getMonthStatistics(year, month)
})

const calendarEventDates = computed(() => {
  const events = []
  const allData = drinksStore.getAllData

  Object.keys(allData).forEach(dateKey => {
    const drinkCount = drinksStore.getDrinkCount(dateKey)
    if (drinkCount > 0) {
      // Convert date format from YYYY/MM/DD to YYYY/MM/DD for q-date
      const dateParts = dateKey.split('/')
      const formattedDate = `${dateParts[0]}/${dateParts[1].padStart(2, '0')}/${dateParts[2].padStart(2, '0')}`

      // Determine color and class based on drink count
      let color = 'green'
      let cssClass = 'drink-level-low'
      if (drinkCount > 12) {
        color = 'black'
        cssClass = 'drink-level-extreme'
      } else if (drinkCount > 8) {
        color = 'red'
        cssClass = 'drink-level-high'
      } else if (drinkCount > 4) {
        color = 'orange'
        cssClass = 'drink-level-medium'
      }

      events.push({
        date: formattedDate,
        color: color,
        cssClass: cssClass,
        drinkCount: drinkCount
      })
    }
  })

  return events
})

const hasPersonalData = computed(() => {
  return personalDataStore.isDataComplete()
})

const alcoholCaloriePercentage = computed(() => {
  if (!hasPersonalData.value || !currentMonthStats.value) return null

  const dailyCalorieNeeds = personalDataStore.getDailyCalorieNeeds()
  const monthDays = new Date(new Date(selectedDate.value).getFullYear(), new Date(selectedDate.value).getMonth() + 1, 0).getDate()
  const monthlyCalorieNeeds = dailyCalorieNeeds * monthDays

  return (currentMonthStats.value.totalCalories / monthlyCalorieNeeds) * 100
})

const dailyAlcoholCaloriePercentage = computed(() => {
  if (!hasPersonalData.value) return null

  const dailyCalorieNeeds = personalDataStore.getDailyCalorieNeeds()
  if (!dailyCalorieNeeds || dailyCalorieNeeds === 0) return null

  // Get total calories for the selected date
  const dateBeverages = drinksStore.getDateBeverages(selectedDate.value)
  const dailyCalories = dateBeverages.reduce((total, beverage) => {
    const calories = beverage.calories || 0
    const count = beverage.count || 0
    return total + (calories * count)
  }, 0)

  if (dailyCalories === 0) return 0

  const percentage = (dailyCalories / dailyCalorieNeeds) * 100
  return isNaN(percentage) ? 0 : percentage
})

const monthlyWeightGain = computed(() => {
  if (!hasPersonalData.value || !currentMonthStats.value) return null
  return personalDataStore.getMonthlyWeightGain(currentMonthStats.value)
})

const todaysCalories = computed(() => {
  // Use the reactive currentDateBeverages instead of calling getDateBeverages directly
  const dailyCalories = currentDateBeverages.value.reduce((total, beverage) => {
    const calories = beverage.calories || 0
    const count = beverage.count || 0
    return total + (calories * count)
  }, 0)

  return dailyCalories
})

const annualWeightGainProjection = computed(() => {
  if (!hasPersonalData.value || !currentMonthStats.value) return null
  return personalDataStore.getAnnualWeightGainProjection(currentMonthStats.value)
})

const currentMonthCaloriePercentage = computed(() => alcoholCaloriePercentage.value)
const currentMonthWeightGain = computed(() => monthlyWeightGain.value)
const currentMonthAnnualProjection = computed(() => annualWeightGainProjection.value)

const formatSelectedDate = computed(() => {
  return date.formatDate(selectedDate.value, 'dddd, MMMM D, YYYY')
})

// BAC Calculation
const calculateBAC = computed(() => {
  if (!hasPersonalData.value || !personalDataStore.personalData.weight || !personalDataStore.personalData.sex) {
    return null
  }

  const drinks = currentDateCounter.value
  if (drinks === 0) return null

  // Widmark formula: BAC = (A / (r × W)) - (β × t)
  // A = grams of alcohol consumed
  // r = gender constant (0.68 for males, 0.55 for females)
  // W = body weight in grams
  // β = elimination rate (0.015 per hour)
  // t = time elapsed (assuming recent consumption, t = 0)

  const alcoholGrams = drinks * 14 // 14g per standard drink
  const weightKg = personalDataStore.personalData.weight
  const sex = personalDataStore.personalData.sex

  let r = 0.68 // male
  if (sex === 'female') {
    r = 0.55
  }

  const bac = (alcoholGrams / (r * weightKg * 1000)) * 100 // Convert to percentage
  return bac
})

const calculateClearanceTime = computed(() => {
  const bac = calculateBAC.value
  if (!bac) return null

  // Normal liver eliminates alcohol at ~0.015% BAC per hour
  const eliminationRate = 0.015
  const hours = bac / eliminationRate

  if (hours < 1) {
    return `${Math.round(hours * 60)} minutes`
  } else if (hours < 24) {
    const wholeHours = Math.floor(hours)
    const minutes = Math.round((hours - wholeHours) * 60)
    return minutes > 0 ? `${wholeHours}h ${minutes}m` : `${wholeHours} hours`
  } else {
    const days = Math.floor(hours / 24)
    const remainingHours = Math.round(hours % 24)
    return `${days} day${days > 1 ? 's' : ''} ${remainingHours}h`
  }
})

// Methods
const openCounterDialog = () => {
  // Ensure we have a valid date
  if (!selectedDate.value || selectedDate.value === 'null') {
    selectedDate.value = date.formatDate(new Date(), 'YYYY/MM/DD')
  }

  showCounterDialog.value = true
}

const onDateSelect = (newDate) => {
  // If newDate is null, use today's date as fallback
  if (!newDate) {
    newDate = date.formatDate(new Date(), 'YYYY/MM/DD')
  }

  selectedDate.value = newDate
  showCounterDialog.value = true
}

const incrementCounter = () => {
  drinksStore.incrementDrinkCount(selectedDate.value)
}

const decrementCounter = () => {
  if (currentDateCounter.value > 0) {
    drinksStore.decrementDrinkCount(selectedDate.value)
  }
}

const addSelectedBeverage = (beverageId = null) => {
  if (beverageId) {
    // Adding a specific beverage by ID (from the + button)
    if (beverageId === 'generic') {
      // Handle generic "Standard Drink" - use incrementDrinkCount
      drinksStore.incrementDrinkCount(selectedDate.value)
    } else {
      // Handle predefined beverages from the database
      const beverage = beverageData.value.find(b => b.id === beverageId)
      if (beverage) {
        drinksStore.addBeverage(selectedDate.value, beverage)
      }
    }
  } else if (selectedBeverage.value) {
    // Adding from dropdown selection (existing functionality)
    drinksStore.addBeverage(selectedDate.value, selectedBeverage.value)
    selectedBeverage.value = null
  }
}

const removeSelectedBeverage = (beverageId) => {
  drinksStore.removeBeverage(selectedDate.value, beverageId)
}

// Helper methods
const getCaloriePercentageClass = (percentage) => {
  if (percentage > 20) return 'text-red'
  if (percentage > 10) return 'text-orange'
  if (percentage > 5) return 'text-yellow-8'
  return 'text-green'
}

const getWeightGainClass = (kg) => {
  if (kg > 2) return 'text-red'
  if (kg > 1) return 'text-orange'
  if (kg > 0.5) return 'text-yellow-8'
  return 'text-green'
}

// Watch for customBeverage changes to auto-calculate standard drinks
watch([() => customBeverage.value.volume, () => customBeverage.value.alcoholPercent], () => {
  if (customBeverage.value.volume && customBeverage.value.alcoholPercent) {
    // Volume is now a number (in ml), no need to extract
    const volume = customBeverage.value.volume;
    if (volume > 0) {
      // Standard drink formula: (Volume in ml × Alcohol % × 0.789) / 100 / 10
      // 0.789 is the density of ethanol, 10g is one standard drink
      const pureAlcoholGrams = (volume * customBeverage.value.alcoholPercent * 0.789) / 100;
      const standardDrinks = pureAlcoholGrams / 10;
      customBeverage.value.standardDrinks = Math.round(standardDrinks * 10) / 10;
    }
  }
})

// Watch for calendar events changes and apply styling
const applyCalendarStyling = () => {
  setTimeout(() => {
    const calendarElement = document.querySelector('.drink-calendar')
    if (!calendarElement) return

    // Get all event data
    const eventsByDate = {}
    calendarEventDates.value.forEach(event => {
      eventsByDate[event.date] = event
    })

    // Get the selected date for comparison
    const currentDate = new Date(selectedDate.value)
    const selectedYear = currentDate.getFullYear()
    const selectedMonth = (currentDate.getMonth() + 1).toString().padStart(2, '0')
    const selectedDay = currentDate.getDate().toString().padStart(2, '0')
    const selectedFullDate = `${selectedYear}/${selectedMonth}/${selectedDay}`

    // Find all calendar date buttons
    const dateButtons = calendarElement.querySelectorAll('.q-date__calendar-item .q-btn')
    dateButtons.forEach(button => {
      const dateText = button.textContent?.trim()
      if (!dateText) return

      // Get current displayed month/year from the calendar
      const calendarTitle = calendarElement.querySelector('.q-date__header-title')?.textContent
      if (!calendarTitle) return

      // Parse the current month/year (format varies by locale)
      const year = currentDate.getFullYear()
      const month = (currentDate.getMonth() + 1).toString().padStart(2, '0')
      const day = dateText.padStart(2, '0')
      const fullDate = `${year}/${month}/${day}`

      // Check if this is the selected date
      const isSelected = fullDate === selectedFullDate

      // Check if this date has drink data
      const eventData = eventsByDate[fullDate]
      if (eventData) {
        // Remove any existing drink-level classes
        button.classList.remove('drink-level-low', 'drink-level-medium', 'drink-level-high', 'drink-level-extreme')

        // Apply styling based on drink count
        const drinkCount = eventData.drinkCount
        let bgColor, textColor, fontWeight = '600'

        if (drinkCount > 12) {
          // Black - keep black when selected (as requested)
          bgColor = 'rgba(0, 0, 0, 0.8)'
          textColor = 'white'
          fontWeight = '700'
        } else if (drinkCount > 8) {
          // Red - darker red when selected
          bgColor = isSelected ? 'rgba(211, 47, 47, 0.9)' : 'rgba(244, 67, 54, 0.7)'
          textColor = 'white'
          fontWeight = '700'
        } else if (drinkCount > 4) {
          // Orange - darker orange when selected
          bgColor = isSelected ? 'rgba(230, 126, 34, 0.9)' : 'rgba(255, 152, 0, 0.8)'
          textColor = 'white'
          fontWeight = '600'
        } else {
          // Green - darker green when selected
          bgColor = isSelected ? 'rgba(56, 142, 60, 0.9)' : 'rgba(76, 175, 80, 0.7)'
          textColor = 'white'
          fontWeight = '600'
        }

        button.style.backgroundColor = bgColor
        button.style.color = textColor
        button.style.fontWeight = fontWeight
        button.style.borderRadius = '6px'

        // Force override of any Quasar classes
        button.style.setProperty('background-color', bgColor, 'important')
        button.style.setProperty('color', textColor, 'important')

        // Add subtle border for selected dates to make them more prominent
        if (isSelected) {
          button.style.border = '2px solid rgba(255, 255, 255, 0.3)'
          button.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.2)'
        } else {
          button.style.border = ''
          button.style.boxShadow = ''
        }
      } else {
        // Reset styling for dates without drinks
        button.style.backgroundColor = ''
        button.style.color = ''
        button.style.fontWeight = ''
        button.style.border = ''
        button.style.boxShadow = ''

        // Apply light grey background for selected dates with no drinks
        if (isSelected) {
          button.style.backgroundColor = 'rgba(158, 158, 158, 0.3)' // Light grey
          button.style.border = '2px solid rgba(117, 117, 117, 0.4)'
          // Force override with important
          button.style.setProperty('background-color', 'rgba(158, 158, 158, 0.3)', 'important')
        }
      }
    })
  }, 100) // Small delay to ensure DOM is updated
}

// Initialize on mount
onMounted(() => {
  layoutStore.initialize()
  applyCalendarStyling()
})

// Watch for changes in calendar events and reapply styling
watch(calendarEventDates, () => {
  applyCalendarStyling()
}, { deep: true })

// Watch for date changes (month navigation)
watch(selectedDate, () => {
  applyCalendarStyling()
})
</script>

<style scoped>
.drink-calendar {
  font-size: 14px;
}

@media (min-width: 768px) {
  .drink-calendar {
    font-size: 16px;
  }
}

.drink-counter-value {
  font-size: 1.5rem;
  font-weight: bold;
}

@media (min-width: 768px) {
  .drink-counter-value {
    font-size: 2rem;
  }
}

/* Calendar styling - simplified approach with JavaScript DOM manipulation */
.drink-calendar :deep(.q-date__calendar-item) {
  border-radius: 6px;
  transition: all 0.2s ease;
  padding: 2px; /* Minimal padding to allow button to expand */
}

/* Make calendar date buttons fill the entire available space */
.drink-calendar :deep(.q-date__calendar-item .q-btn) {
  width: 100% !important;
  height: 100% !important;
  min-height: 35px !important; /* Slightly smaller for mobile */
  min-width: 35px !important; /* Slightly smaller for mobile */
  margin: 0 !important;
  border-radius: 6px !important;
  font-size: 14px !important; /* Smaller font for mobile */
  font-weight: 500 !important;
}

/* Override Quasar's default selected date styling to allow custom colors */
.drink-calendar :deep(.q-date__calendar-item .q-btn.q-btn--unelevated) {
  background: none !important;
}

.drink-calendar :deep(.q-date__calendar-item .q-btn.q-date__calendar-item--in) {
  background: none !important;
  color: inherit !important;
}

/* Override the default blue selection color */
.drink-calendar :deep(.q-date__calendar-item--in .q-btn) {
  background: none !important;
}

/* More aggressive overrides for all Quasar button states */
.drink-calendar :deep(.q-btn.bg-primary) {
  background: none !important;
}

.drink-calendar :deep(.q-btn.text-white) {
  color: inherit !important;
}

/* Override any Quasar state classes that might interfere */
.drink-calendar :deep(.q-date__calendar-item .q-btn.q-btn--actionable) {
  background: transparent !important;
}

.drink-calendar :deep(.q-date__calendar-item .q-btn.q-date__today) {
  background: transparent !important;
  box-shadow: none !important;
}

/* Make the calendar itself more spacious */
.drink-calendar :deep(.q-date__calendar) {
  width: 100%;
}

.drink-calendar :deep(.q-date__calendar-days) {
  height: auto;
}

.drink-calendar :deep(.q-date__calendar-item) {
  height: 42px !important; /* Slightly smaller height for mobile */
  min-height: 42px !important;
}

/* Hide the small event dots since we color the full cells with JavaScript */
.drink-calendar :deep(.q-date__event) {
  display: none !important;
}

/* Enhanced hover effects for calendar dates */
.drink-calendar :deep(.q-date__calendar-item .q-btn:hover) {
  transform: scale(1.02) !important; /* Reduced scale to prevent overlap */
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15) !important;
  z-index: 1 !important;
}

/* Calendar day content styling */
.calendar-day-content {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: background-color 0.2s ease;
}

/* Background colors for different drink levels */
.calendar-day-none {
  background-color: transparent;
}

.calendar-day-low {
  background-color: rgba(76, 175, 80, 0.15) !important; /* Light green */
}

.calendar-day-medium {
  background-color: rgba(255, 193, 7, 0.2) !important; /* Light yellow */
}

.calendar-day-high {
  background-color: rgba(255, 152, 0, 0.25) !important; /* Light orange */
}

.calendar-day-very-high {
  background-color: rgba(244, 67, 54, 0.25) !important; /* Light red */
}

/* Drink count indicators */
.drink-indicator {
  position: absolute;
  top: 1px;
  right: 1px;
  min-width: 14px;
  height: 14px;
  border-radius: 7px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 9px;
  font-weight: bold;
  color: white;
  line-height: 1;
}

.drink-indicator-green {
  background-color: #4CAF50; /* Green */
}

.drink-indicator-yellow {
  background-color: #FF9800; /* Orange (more visible than yellow) */
}

.drink-indicator-orange {
  background-color: #FF5722; /* Deep orange */
}

.drink-indicator-red {
  background-color: #F44336; /* Red */
}

/* Calendar legend dots */
.calendar-legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  display: inline-block;
}

/* Enhance calendar day hover effects */
.calendar-day-content:hover {
  opacity: 0.8;
}
</style>
