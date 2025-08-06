<template>
  <q-page class="q-pa-md">
    <div class="q-mb-md">
      <h4 class="text-center q-my-md">Drink Counter Calendar</h4>
    </div>

    <!-- Calendar Section -->
    <q-card class="q-mb-md">
      <q-card-section>
        <q-date
          v-model="selectedDate"
          :options="optionsFn"
          @update:model-value="onDateSelect"
          class="full-width drink-calendar"
        />
      </q-card-section>
    </q-card>

    <!-- Monthly Summary Section -->
    <div v-if="currentMonthStats && currentMonthStats.totalStandardDrinks > 0">
      <q-card class="bg-blue-1 q-mb-md">
        <q-card-section>
          <div class="text-h6 q-mb-md">
            <q-icon name="analytics" class="q-mr-xs" />
            This Month's Statistics
          </div>

          <!-- Statistics Cards -->
          <div class="row q-gutter-md">
            <div class="col-12 col-sm-6 col-md-3">
              <q-card class="bg-white">
                <q-card-section class="text-center">
                  <div class="text-caption text-grey-7">Total Standard Drinks</div>
                  <div class="text-h5 text-primary text-weight-bold">{{ currentMonthStats.totalStandardDrinks }}</div>
                </q-card-section>
              </q-card>
            </div>

            <div class="col-12 col-sm-6 col-md-3">
              <q-card class="bg-white">
                <q-card-section class="text-center">
                  <div class="text-caption text-grey-7">Total Calories</div>
                  <div class="text-h6 text-orange text-weight-bold">{{ Math.round(currentMonthStats.totalCalories / 1000) }}k</div>
                </q-card-section>
              </q-card>
            </div>

            <div class="col-12 col-sm-6 col-md-3">
              <q-card class="bg-white">
                <q-card-section class="text-center">
                  <div class="text-caption text-grey-7">Average per Day</div>
                  <div class="text-h6 text-green text-weight-bold">{{ currentMonthStats.averageStandardDrinksPerDay.toFixed(1) }}</div>
                </q-card-section>
              </q-card>
            </div>

            <div class="col-12 col-sm-6 col-md-3">
              <q-card class="bg-white">
                <q-card-section class="text-center">
                  <div class="text-caption text-grey-7">Drinking Days</div>
                  <div class="text-h6 text-purple text-weight-bold">{{ currentMonthStats.daysWithDrinks }}</div>
                </q-card-section>
              </q-card>
            </div>
          </div>

          <!-- Personal Data Integration -->
          <div v-if="personalDataStore.isDataComplete()" class="q-mt-md">
            <q-separator class="q-mb-md" />

            <div class="row q-gutter-md">
              <div class="col-12 col-sm-4">
                <q-card class="bg-white">
                  <q-card-section class="text-center">
                    <div class="text-caption text-grey-7">Daily Calorie %</div>
                    <div v-if="currentMonthCaloriePercentage" :class="['text-h6 text-weight-bold', getCaloriePercentageClass(currentMonthCaloriePercentage)]">
                      {{ currentMonthCaloriePercentage.toFixed(1) }}%
                    </div>
                    <div v-else class="text-h6">0%</div>
                  </q-card-section>
                </q-card>
              </div>

              <div class="col-12 col-sm-4">
                <q-card class="bg-white">
                  <q-card-section class="text-center">
                    <div class="text-caption text-grey-7">Weight Gain This Month</div>
                    <div class="text-h6 text-weight-bold text-red">
                      {{ currentMonthWeightGain ? currentMonthWeightGain.kg : 0 }} kg
                    </div>
                  </q-card-section>
                </q-card>
              </div>

              <div class="col-12 col-sm-4">
                <q-card class="bg-white">
                  <q-card-section class="text-center">
                    <div class="text-caption text-grey-7">Annual Projection</div>
                    <div v-if="currentMonthAnnualProjection" :class="['text-h6 text-weight-bold', getWeightGainClass(currentMonthAnnualProjection.kg)]">
                      {{ currentMonthAnnualProjection.kg }}kg/yr
                    </div>
                    <div v-else class="text-h6">0kg/yr</div>
                  </q-card-section>
                </q-card>
              </div>
            </div>
          </div>

          <!-- Health Warning -->
          <div v-if="currentMonthAnnualProjection && currentMonthAnnualProjection.kg > 2" class="q-mt-md">
            <q-banner dense class="bg-red-1 text-red">
              <template v-slot:avatar>
                <q-icon name="warning" />
              </template>
              At current levels: {{ currentMonthAnnualProjection.kg }} kg/year weight gain
            </q-banner>
          </div>
        </q-card-section>
      </q-card>
    </div>

    <!-- Beverage Reference Guide -->
    <q-card class="q-mb-md">
      <q-card-section>
        <h6 class="q-my-md text-center">Beverage Reference Guide</h6>
        <q-table
          :rows="beverageData"
          :columns="beverageColumns"
          row-key="id"
          flat
          dense
          :rows-per-page="0"
          :rows-per-page-options="[0]"
          hide-pagination
          @row-dblclick="onRowDblClick"
        >
          <template v-slot:body="props">
            <q-tr
              :props="props"
              draggable="true"
              @dragstart="startDrag($event, props.rowIndex)"
              @dragover.prevent="onDragOver($event)"
              @drop="onDrop($event, props.rowIndex)"
              @dragend="onDragEnd($event)"
              class="draggable-row"
            >
              <q-td
                v-for="col in props.cols"
                :key="col.name"
                :props="props"
                :class="col.classes"
                :style="col.style"
              >
                <template v-if="col.name === 'name'">
                  <div class="text-weight-medium">{{ col.value }}</div>
                </template>
                <template v-else-if="col.name === 'alcoholPercent'">
                  <q-badge color="blue" :label="`${col.value}%`" />
                </template>
                <template v-else-if="col.name === 'standardDrinks'">
                  <q-badge
                    :color="col.value > 1 ? 'orange' : 'green'"
                    :label="`${col.value}`"
                  />
                </template>
                <template v-else-if="col.name === 'calories'">
                  <span class="text-weight-medium">{{ col.value }}</span>
                </template>
                <template v-else-if="col.name === 'actions'">
                  <div class="q-gutter-xs">
                    <q-btn
                      flat
                      round
                      color="primary"
                      icon="edit"
                      size="sm"
                      @click="editBeverage(props.row)"
                    />
                    <q-btn
                      v-if="props.row.type === 'Custom'"
                      flat
                      round
                      color="negative"
                      icon="delete"
                      size="sm"
                      @click="deleteCustomBeverage(props.row.id)"
                    />
                  </div>
                </template>
                <template v-else>
                  {{ col.value }}
                </template>
              </q-td>
            </q-tr>
          </template>
        </q-table>

        <!-- Add Custom Beverage Button -->
        <div class="q-mt-md text-center q-gutter-md">
          <q-btn
            color="primary"
            icon="add"
            label="Add Custom Beverage"
            @click="openAddBeverageDialog"
            outline
          />
          <q-btn
            color="orange"
            icon="refresh"
            label="Reset to Defaults"
            @click="resetOriginalBeverages"
            outline
          />
        </div>
      </q-card-section>
    </q-card>

    <!-- Floating Action Button -->
    <q-page-sticky position="bottom-right" :offset="[18, 18]">
      <q-btn
        fab
        icon="local_bar"
        color="primary"
        @click="showCounterDialog = true"
      >
        <q-badge
          v-if="currentDateCounter > 0"
          color="red"
          :label="currentDateCounter"
          floating
        />
      </q-btn>
    </q-page-sticky>

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
                </div>
              </div>

              <div class="row items-center q-mb-sm">
                <div class="col-6">Weight Gain:</div>
                <div class="col-6 text-right">
                  <span v-if="monthlyWeightGain">{{ monthlyWeightGain.kg }} kg</span>
                  <span v-else>0 kg</span>
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

    <!-- Custom Beverage Dialog -->
    <q-dialog v-model="showCustomBeverageDialog" persistent>
      <q-card style="min-width: 400px;">
        <q-card-section>
          <div class="text-h6">{{ isEditingBeverage ? 'Edit' : 'Add' }} Custom Beverage</div>
        </q-card-section>

        <q-card-section>
          <q-form @submit="saveCustomBeverage" class="q-gutter-md">
            <q-input
              filled
              v-model="customBeverage.name"
              label="Beverage Name *"
              lazy-rules
              :rules="[ val => val && val.length > 0 || 'Please enter a name']"
            />

            <q-input
              filled
              v-model.number="customBeverage.volume"
              type="number"
              label="Volume in ml (e.g. 355, 500) *"
              lazy-rules
              :rules="[
                val => val && val > 0 || 'Please enter a valid volume in ml'
              ]"
            />

            <q-input
              filled
              v-model.number="customBeverage.alcoholPercent"
              type="number"
              label="Alcohol Percentage *"
              suffix="%"
              step="0.1"
              min="0"
              max="100"
              lazy-rules
              :rules="[
                val => val !== null || 'Please enter alcohol percentage',
                val => val >= 0 && val <= 100 || 'Please enter a valid percentage (0-100)'
              ]"
            />

            <q-input
              filled
              v-model.number="customBeverage.standardDrinks"
              type="number"
              label="Standard Drinks"
              step="0.1"
              min="0"
              hint="Leave empty to calculate automatically"
            />

            <q-input
              filled
              v-model.number="customBeverage.calories"
              type="number"
              label="Calories per serving"
              min="0"
              hint="Leave empty to estimate automatically"
            />

            <q-input
              filled
              v-model="customBeverage.description"
              label="Description (optional)"
              type="textarea"
              rows="2"
            />
          </q-form>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancel" color="primary" @click="cancelCustomBeverage" />
          <q-btn
            flat
            :label="isEditingBeverage ? 'Update' : 'Save'"
            color="primary"
            @click="saveCustomBeverage"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useDrinksStore } from 'src/stores/drinks-store'
import { usePersonalDataStore } from 'src/stores/personal-data-store'
import { date } from 'quasar'

// Store instances
const drinksStore = useDrinksStore()
const personalDataStore = usePersonalDataStore()

// Reactive state
const selectedDate = ref(date.formatDate(new Date(), 'YYYY/MM/DD'))
const selectedBeverage = ref(null)
const showCounterDialog = ref(false)
const showCustomBeverageDialog = ref(false)
const customBeverage = ref({
  name: '',
  volume: '',
  alcoholPercent: 0,
  standardDrinks: 0,
  calories: 0,
  description: '',
  type: 'Custom'
})
const isEditingBeverage = ref(false)
const editingBeverageId = ref(null)
const draggedIndex = ref(null)

// Table columns
const beverageColumns = [
  {
    name: 'name',
    required: true,
    label: 'Beverage',
    align: 'left',
    field: 'name',
    sortable: true,
    style: 'width: 25%'
  },
  {
    name: 'volume',
    label: 'Volume',
    align: 'center',
    field: 'volume',
    sortable: false,
    style: 'width: 15%'
  },
  {
    name: 'alcoholPercent',
    label: 'Alcohol %',
    align: 'center',
    field: 'alcoholPercent',
    sortable: true,
    style: 'width: 15%'
  },
  {
    name: 'standardDrinks',
    label: 'Std Drinks',
    align: 'center',
    field: 'standardDrinks',
    sortable: true,
    style: 'width: 15%'
  },
  {
    name: 'calories',
    label: 'Calories',
    align: 'center',
    field: 'calories',
    sortable: true,
    style: 'width: 15%'
  },
  {
    name: 'actions',
    label: 'Actions',
    align: 'center',
    field: 'actions',
    sortable: false,
    style: 'width: 15%'
  }
]

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
  const drinks = drinksStore.getDateDrinks(selectedDate.value)
  return drinks
})

const currentDateCounter = computed(() => {
  return drinksStore.getDateTotal(selectedDate.value)
})

const currentMonthStats = computed(() => {
  const currentDate = new Date(selectedDate.value)
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth() + 1
  return drinksStore.getMonthStatistics(year, month)
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
  return personalDataStore.getMonthlyWeightGain(currentMonthStats.value.totalCalories)
})

const annualWeightGainProjection = computed(() => {
  if (!monthlyWeightGain.value) return null
  return {
    kg: (monthlyWeightGain.value.kg * 12).toFixed(1),
    calories: monthlyWeightGain.value.calories * 12
  }
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
}

const incrementCounter = () => {
  drinksStore.addDrink(selectedDate.value, 'manual', 1)
}

const decrementCounter = () => {
  if (currentDateCounter.value > 0) {
    drinksStore.removeDrink(selectedDate.value, 'manual', 1)
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

const onRowDblClick = (evt, row) => {
  editBeverage(row)
}

const editBeverage = (beverage) => {
  isEditingBeverage.value = true
  editingBeverageId.value = beverage.id
  customBeverage.value = { ...beverage }
  showCustomBeverageDialog.value = true
}

const openAddBeverageDialog = () => {
  isEditingBeverage.value = false
  editingBeverageId.value = null
  customBeverage.value = {
    name: '',
    volume: '',
    alcoholPercent: 0,
    standardDrinks: 0,
    calories: 0,
    description: '',
    type: 'Custom'
  }
  showCustomBeverageDialog.value = true
}

const saveCustomBeverage = () => {
  if (customBeverage.value.name && customBeverage.value.volume && customBeverage.value.alcoholPercent >= 0) {
    if (isEditingBeverage.value) {
      drinksStore.updateBeverage(editingBeverageId.value, customBeverage.value)
    } else {
      drinksStore.addCustomBeverage(customBeverage.value)
    }
    showCustomBeverageDialog.value = false
  }
}

const cancelCustomBeverage = () => {
  showCustomBeverageDialog.value = false
}

const deleteCustomBeverage = (beverageId) => {
  drinksStore.deleteCustomBeverage(beverageId)
}

const resetOriginalBeverages = () => {
  drinksStore.resetOriginalBeverages()
}

// Drag and drop methods
const startDrag = (evt, index) => {
  draggedIndex.value = index
  evt.dataTransfer.effectAllowed = 'move'
  evt.target.classList.add('dragging')
}

const onDragOver = (evt) => {
  evt.preventDefault()
  evt.dataTransfer.dropEffect = 'move'
}

const onDrop = (evt, targetIndex) => {
  evt.preventDefault()
  if (draggedIndex.value !== null && draggedIndex.value !== targetIndex) {
    drinksStore.moveBeverage(draggedIndex.value, targetIndex)
  }
  draggedIndex.value = null
}

const onDragEnd = (evt) => {
  evt.target.classList.remove('dragging')
  draggedIndex.value = null
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

// Initialize on mount
onMounted(() => {
  // No specific initialization needed
})
</script>

<style scoped>
.drink-calendar {
  font-size: 16px;
}

.drink-counter-value {
  font-size: 2rem;
  font-weight: bold;
}

.draggable-row {
  cursor: grab;
  transition: background-color 0.2s ease;
}

.draggable-row:hover {
  background-color: rgba(0, 0, 0, 0.05);
}

.draggable-row.dragging {
  opacity: 0.5;
  cursor: grabbing;
}

@media (max-width: 600px) {
  .drink-calendar {
    font-size: 14px;
  }
}
</style>
