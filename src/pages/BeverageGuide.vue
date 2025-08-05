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
              v-model="customBeverage.volume"
              label="Volume in ml (e.g., '355ml', '500ml') *"
              lazy-rules
              :rules="[
                val => val && val.length > 0 || 'Please enter volume',
                val => /^\d+(\.\d+)?\s*ml$/i.test(val.trim()) || 'Please enter volume in ml format (e.g., 355ml)'
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
import { ref, computed, watch } from 'vue'
import { useDrinksStore } from 'src/stores/drinks-store'

// Store instances
const drinksStore = useDrinksStore()

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
  drinksStore.deleteBeverage(beverageId)
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
