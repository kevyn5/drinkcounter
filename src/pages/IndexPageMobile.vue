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
                  <div class="col-4 col-md-4">
                    <q-card class="bg-white q-pa-xs q-pa-sm-md">
                      <div class="text-caption text-grey-7">Daily Cal %</div>
                      <div v-if="currentMonthCaloriePercentage" :class="['text-body2 text-weight-bold', getCaloriePercentageClass(currentMonthCaloriePercentage)]">
                        {{ currentMonthCaloriePercentage.toFixed(1) }}%
                      </div>
                      <div v-else class="text-body2">0%</div>
                    </q-card>
                  </div>

                  <div class="col-4 col-md-4">
                    <q-card class="bg-white q-pa-xs q-pa-sm-md">
                      <div class="text-caption text-grey-7">Weight Gain</div>
                      <div class="text-body2 text-weight-bold text-red">
                        {{ currentMonthWeightGain ? currentMonthWeightGain.kg : 0 }} kg
                      </div>
                    </q-card>
                  </div>

                  <div class="col-4 col-md-4">
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
        @click="showCounterDialog = true"
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
        <q-card-section>
          <div class="text-h6">{{ formatSelectedDate }}</div>
        </q-card-section>

        <q-card-section>
          <div class="row items-center justify-between q-mb-md">
            <div class="text-h4">{{ currentDateCounter }}</div>
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
              option-value="id"
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
              @click="addSelectedBeverage"
              :disable="!selectedBeverage"
            />
          </div>

          <!-- Monthly Statistics Section -->
          <div v-if="currentMonthStats && currentMonthStats.totalStandardDrinks > 0" class="q-mt-lg">
            <q-separator class="q-mb-md" />
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

            <!-- Personal Data Integration -->
            <div v-if="hasPersonalData">
              <q-separator class="q-my-md" />

              <div class="row items-center q-mb-sm">
                <div class="col-6">Daily Calorie %:</div>
                <div class="col-6 text-right">
                  <span v-if="alcoholCaloriePercentage" :class="getCaloriePercentageClass(alcoholCaloriePercentage)">
                    {{ alcoholCaloriePercentage.toFixed(1) }}%
                  </span>
                  <span v-else>0%</span>
                  <q-tooltip v-if="alcoholCaloriePercentage" class="bg-grey-8">
                    Based on your BMR of {{ personalDataStore.getDailyCalorieNeeds() }} calories/day
                  </q-tooltip>
                </div>
              </div>

              <div class="row items-center q-mb-sm">
                <div class="col-6">Weight Gain:</div>
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
              </div>

              <div class="row items-center">
                <div class="col-6">Weight Gain:</div>
                <div class="col-6 text-right">
                  <span v-if="monthlyWeightGain">{{ monthlyWeightGain.kg }} kg</span>
                  <span v-else>0 kg</span>
                </div>
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

        <q-card-actions align="right">
          <q-btn flat label="Close" color="primary" v-close-popup />
        </q-card-actions>
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

const monthlyWeightGain = computed(() => {
  if (!hasPersonalData.value || !currentMonthStats.value) return null
  return personalDataStore.getMonthlyWeightGain(currentMonthStats.value)
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

// Methods
const onDateSelect = (newDate) => {
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

const addSelectedBeverage = () => {
  if (selectedBeverage.value) {
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
    // Use the store's volume extraction function for consistency
    const volume = drinksStore.extractVolumeInMl(customBeverage.value.volume);
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

    // Find all calendar date buttons
    const dateButtons = calendarElement.querySelectorAll('.q-date__calendar-item .q-btn')
    dateButtons.forEach(button => {
      const dateText = button.textContent?.trim()
      if (!dateText) return

      // Get current displayed month/year from the calendar
      const calendarTitle = calendarElement.querySelector('.q-date__header-title')?.textContent
      if (!calendarTitle) return

      // Parse the current month/year (format varies by locale)
      const currentDate = new Date(selectedDate.value)
      const year = currentDate.getFullYear()
      const month = (currentDate.getMonth() + 1).toString().padStart(2, '0')
      const day = dateText.padStart(2, '0')
      const fullDate = `${year}/${month}/${day}`

      // Check if this date has drink data
      const eventData = eventsByDate[fullDate]
      if (eventData) {
        // Remove any existing drink-level classes
        button.classList.remove('drink-level-low', 'drink-level-medium', 'drink-level-high', 'drink-level-extreme')

        // Apply styling based on drink count
        const drinkCount = eventData.drinkCount
        let bgColor, textColor, fontWeight = '600'

        if (drinkCount > 12) {
          bgColor = 'rgba(0, 0, 0, 0.8)' // Stronger black to match legend
          textColor = 'white'
          fontWeight = '700'
        } else if (drinkCount > 8) {
          bgColor = 'rgba(244, 67, 54, 0.7)' // Stronger red to match legend
          textColor = 'white'
          fontWeight = '700'
        } else if (drinkCount > 4) {
          bgColor = 'rgba(255, 152, 0, 0.8)' // Stronger orange to match legend
          textColor = 'white'
          fontWeight = '600'
        } else {
          bgColor = 'rgba(76, 175, 80, 0.7)' // Stronger green to match legend
          textColor = 'white'
          fontWeight = '600'
        }

        button.style.backgroundColor = bgColor
        button.style.color = textColor
        button.style.fontWeight = fontWeight
        button.style.borderRadius = '6px'
      } else {
        // Reset styling for dates without drinks
        button.style.backgroundColor = ''
        button.style.color = ''
        button.style.fontWeight = ''
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
