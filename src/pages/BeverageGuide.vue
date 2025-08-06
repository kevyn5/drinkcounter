<template>
  <q-page class="q-pa-md">
    <div class="row items-center justify-between q-mb-md">
      <div class="col">
        <h4 class="q-my-none">Beverage Reference Guide</h4>
        <p class="text-caption text-grey-6 q-mb-none">Manage your beverage list and reference information</p>
      </div>
    </div>

    <!-- Beverage Reference Guide -->
    <q-card>
      <q-card-section>
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
                <template v-else-if="col.name === 'volume'">
                  <q-badge color="grey" :label="col.value + ' ml'" />
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
                      flat
                      round
                      color="negative"
                      icon="delete"
                      size="sm"
                      @click="deleteCustomBeverage(props.row.id)"
                    >
                      <q-tooltip v-if="props.row.isOriginal">
                        Delete default beverage (can be restored via Settings)
                      </q-tooltip>
                      <q-tooltip v-else>
                        Delete custom beverage
                      </q-tooltip>
                    </q-btn>
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
            color="positive"
            icon="bookmark"
            label="Save as Default"
            @click="saveAsDefaultBeverages"
            outline
          />
        </div>

        <div class="q-mt-sm text-center">
          <div class="text-caption text-grey-6">
            Save as Default: Saves current beverage list as your personal defaults
          </div>
        </div>
      </q-card-section>
    </q-card>

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

            <q-select
              filled
              v-model="customBeverage.type"
              :options="beverageTypeOptions"
              label="Beverage Type"
              hint="Helps estimate calories more accurately"
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
              hint="Enter actual calories from label, or leave empty to estimate"
              @blur="onCaloriesBlur"
            >
              <template v-slot:append>
                <q-btn
                  flat
                  round
                  dense
                  icon="refresh"
                  @click="calculateEstimatedCalories"
                  color="primary"
                >
                  <q-tooltip>Recalculate estimated calories</q-tooltip>
                </q-btn>
              </template>
            </q-input>

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
import { ref, computed, watch, nextTick } from 'vue'
import { useQuasar } from 'quasar'
import { useDrinksStore } from 'src/stores/drinks-store'

// Store instances
const drinksStore = useDrinksStore()
const $q = useQuasar()

// Reactive state
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
const refreshKey = ref(0)

// Beverage type options for better calorie estimation
const beverageTypeOptions = [
  'Beer',
  'Wine',
  'Spirits',
  'Cocktail',
  'Seltzer',
  'Cider',
  'Liqueur',
  'Other',
  'Custom'
]

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
const beverageData = computed(() => {
  // Use refreshKey to force reactivity when needed
  refreshKey.value
  return drinksStore.beverages.map(beverage => {
    // Ensure volume is displayed as a number (extract from string if needed)
    const volumeNumber = typeof beverage.volume === 'string' ?
      drinksStore.extractVolumeInMl(beverage.volume) : beverage.volume

    // Ensure standard drinks are calculated if missing
    let standardDrinks = beverage.standardDrinks
    if (!standardDrinks || standardDrinks === 0) {
      if (volumeNumber > 0 && beverage.alcoholPercent >= 0) {
        const pureAlcoholGrams = (volumeNumber * beverage.alcoholPercent * 0.789) / 100
        standardDrinks = Math.round((pureAlcoholGrams / 10) * 10) / 10
      }
    }

    // Ensure calories are reasonable - recalculate if they seem off or missing
    let calories = beverage.calories
    if (!calories || calories === 0) {
      if (volumeNumber > 0) {
        calories = drinksStore.calculateCalories(volumeNumber, beverage.alcoholPercent || 0, beverage.type || 'Other')
      }
    }

    return {
      ...beverage,
      volume: volumeNumber,
      standardDrinks: standardDrinks || 0,
      calories: calories || 0
    }
  })
})

// Methods
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

const calculateEstimatedCalories = () => {
  const volume = customBeverage.value.volume
  const alcoholPercent = customBeverage.value.alcoholPercent
  const beverageType = customBeverage.value.type || 'Other'

  if (volume > 0) {
    const estimatedCalories = drinksStore.calculateCalories(volume, alcoholPercent, beverageType)
    customBeverage.value.calories = estimatedCalories
  }
}

const onCaloriesBlur = () => {
  // If user cleared the calories field, auto-calculate
  if (!customBeverage.value.calories || customBeverage.value.calories === 0) {
    calculateEstimatedCalories()
  }
}

const saveCustomBeverage = () => {
  if (customBeverage.value.name && customBeverage.value.volume && customBeverage.value.alcoholPercent >= 0) {
    // Ensure standard drinks are calculated if not provided
    if (!customBeverage.value.standardDrinks || customBeverage.value.standardDrinks === 0) {
      const volume = customBeverage.value.volume
      const alcoholPercent = customBeverage.value.alcoholPercent
      if (volume > 0 && alcoholPercent >= 0) {
        // Standard drink formula: (Volume in ml × Alcohol % × 0.789) / 100 / 10
        // 0.789 is the density of ethanol, 10g is one standard drink
        const pureAlcoholGrams = (volume * alcoholPercent * 0.789) / 100
        const standardDrinks = pureAlcoholGrams / 10
        customBeverage.value.standardDrinks = Math.round(standardDrinks * 10) / 10
      }
    }

    // Estimate calories if not provided using the improved calculation
    if (!customBeverage.value.calories || customBeverage.value.calories === 0) {
      const volume = customBeverage.value.volume
      const alcoholPercent = customBeverage.value.alcoholPercent
      const beverageType = customBeverage.value.type || 'Other'

      if (volume > 0) {
        customBeverage.value.calories = drinksStore.calculateCalories(volume, alcoholPercent, beverageType)
      }
    }

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
  // Find the beverage to determine if it's a custom or default beverage
  const beverage = drinksStore.beverages.find(b => b.id === beverageId)
  if (!beverage) return

  const isOriginal = beverage.isOriginal
  const beverageName = beverage.name

  $q.dialog({
    title: 'Confirm Delete',
    message: isOriginal
      ? `Delete "${beverageName}"? This default beverage can be restored via Settings > Reset to Defaults.`
      : `Delete custom beverage "${beverageName}"? This action cannot be undone.`,
    persistent: true,
    ok: {
      push: true,
      color: 'negative',
      label: 'Delete'
    },
    cancel: {
      push: true,
      color: 'grey',
      label: 'Cancel'
    }
  }).onOk(() => {
    drinksStore.deleteBeverage(beverageId)
    // Force table refresh
    refreshKey.value++
    // Use nextTick to ensure the UI updates after the store change
    nextTick(() => {
      $q.notify({
        type: 'positive',
        message: `"${beverageName}" has been deleted`,
        timeout: 2000
      })
    })
  })
}

const saveAsDefaultBeverages = () => {
  $q.dialog({
    title: 'Save as Default',
    message: 'This will save your current beverage list as your personal defaults. These will be loaded when you start the app in the future. Continue?',
    persistent: true,
    ok: {
      push: true,
      color: 'positive',
      label: 'Save as Default'
    },
    cancel: {
      push: true,
      color: 'grey',
      label: 'Cancel'
    }
  }).onOk(() => {
    try {
      drinksStore.saveAsDefaultBeverages()
      $q.notify({
        type: 'positive',
        message: 'Current beverage list saved as your personal defaults',
        timeout: 3000
      })
    } catch (error) {
      console.error('Error saving default beverages:', error)
      $q.notify({
        type: 'negative',
        message: 'Error saving default beverages',
        timeout: 3000
      })
    }
  })
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
    // Create new order by moving the item
    const newOrder = [...beverageData.value]
    const [movedItem] = newOrder.splice(draggedIndex.value, 1)
    newOrder.splice(targetIndex, 0, movedItem)
    drinksStore.reorderBeverages(newOrder)
  }
  draggedIndex.value = null
}

const onDragEnd = (evt) => {
  evt.target.classList.remove('dragging')
  draggedIndex.value = null
}

// Watch for customBeverage changes to auto-calculate standard drinks and calories
watch([() => customBeverage.value.volume, () => customBeverage.value.alcoholPercent, () => customBeverage.value.type], () => {
  if (customBeverage.value.volume && customBeverage.value.alcoholPercent) {
    // Volume is now a number (in ml), no need to extract
    const volume = customBeverage.value.volume;
    const alcoholPercent = customBeverage.value.alcoholPercent;

    if (volume > 0) {
      // Calculate standard drinks
      const pureAlcoholGrams = (volume * alcoholPercent * 0.789) / 100;
      const standardDrinks = pureAlcoholGrams / 10;
      customBeverage.value.standardDrinks = Math.round(standardDrinks * 10) / 10;

      // Update calories only if they haven't been manually set by the user
      // (we'll consider it manually set if it's significantly different from auto-calculation)
      const estimatedCalories = drinksStore.calculateCalories(volume, alcoholPercent, customBeverage.value.type || 'Other');
      const currentCalories = customBeverage.value.calories || 0;

      // If calories are empty or very close to the previous auto-calculation, update them
      if (currentCalories === 0 || Math.abs(currentCalories - estimatedCalories) < Math.max(10, estimatedCalories * 0.2)) {
        customBeverage.value.calories = estimatedCalories;
      }
    }
  }
})
</script>

<style scoped>
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
</style>
