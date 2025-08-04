<template>
  <q-page class="q-pa-md">
    <!-- Back to Home Button -->
    <div class="row justify-between items-center q-mb-md">
      <q-btn
        flat
        icon="arrow_back"
        label="Back to Home"
        color="primary"
        @click="$router.push('/')"
        class="q-mb-sm"
      />
    </div>

    <div class="q-mb-md">
      <h4 class="text-center">Personal Information</h4>
      <p class="text-center text-grey-6">Personalize your drink tracking experience</p>
    </div>

    <div class="row justify-center">
      <div class="col-12 col-md-6">
        <q-form @submit="savePersonalData" class="q-gutter-md">
          <q-card class="q-pa-md">
            <q-card-section>
              <div class="text-h6 q-mb-md">
                <q-icon name="person" class="q-mr-sm" />
                Basic Information
              </div>

              <q-input
                filled
                v-model="form.name"
                label="Full Name *"
                hint="Enter your full name"
                lazy-rules
                :rules="[val => val && val.length > 0 || 'Please enter your name']"
              />

              <q-select
                filled
                v-model="form.sex"
                :options="sexOptions"
                label="Sex *"
                hint="Biological sex for health calculations"
                lazy-rules
                :rules="[val => val || 'Please select your sex']"
              />

              <q-input
                filled
                v-model.number="form.age"
                type="number"
                label="Age *"
                suffix="years"
                min="1"
                max="120"
                hint="Age in years"
                lazy-rules
                :rules="[
                  val => val !== null && val !== '' || 'Please enter your age',
                  val => val > 0 && val <= 120 || 'Please enter a valid age between 1 and 120'
                ]"
              />

              <q-input
                filled
                v-model.number="form.height"
                type="number"
                label="Height *"
                suffix="cm"
                min="50"
                max="250"
                hint="Height in centimeters"
                lazy-rules
                :rules="[
                  val => val !== null && val !== '' || 'Please enter your height',
                  val => val >= 50 && val <= 250 || 'Please enter a valid height between 50 and 250 cm'
                ]"
              />

              <q-input
                filled
                v-model.number="form.weight"
                type="number"
                label="Weight *"
                suffix="kg"
                min="20"
                max="300"
                step="0.1"
                hint="Weight in kilograms"
                lazy-rules
                :rules="[
                  val => val !== null && val !== '' || 'Please enter your weight',
                  val => val >= 20 && val <= 300 || 'Please enter a valid weight between 20 and 300 kg'
                ]"
              />
            </q-card-section>

            <!-- Health Information Display -->
            <q-card-section v-if="calculatedBMI" class="bg-blue-1">
              <div class="text-h6 q-mb-sm">
                <q-icon name="health_and_safety" class="q-mr-sm" />
                Health Information
              </div>

              <div class="row q-gutter-md">
                <div class="col">
                  <div class="text-weight-medium">BMI</div>
                  <div class="text-h6" :class="getBMIColor(calculatedBMI)">
                    {{ calculatedBMI }}
                  </div>
                  <div class="text-caption text-grey-6">
                    {{ getBMICategory(calculatedBMI) }}
                  </div>
                </div>
              </div>
            </q-card-section>

            <q-card-actions align="right" class="q-pt-md">
              <q-btn
                flat
                label="Clear Data"
                color="negative"
                @click="clearData"
                icon="delete"
              />
              <q-btn
                type="submit"
                label="Save Information"
                color="primary"
                icon="save"
                :loading="saving"
              />
            </q-card-actions>
          </q-card>
        </q-form>

        <!-- Current Data Display -->
        <q-card v-if="hasExistingData" class="q-mt-md">
          <q-card-section>
            <div class="text-h6 q-mb-md">
              <q-icon name="info" class="q-mr-sm" />
              Current Information
            </div>

            <div class="row q-gutter-md">
              <div class="col-6 col-sm-4">
                <div class="text-weight-medium">Name</div>
                <div>{{ personalDataStore.personalData.name || 'Not set' }}</div>
              </div>
              <div class="col-6 col-sm-4">
                <div class="text-weight-medium">Sex</div>
                <div class="text-capitalize">{{ personalDataStore.personalData.sex || 'Not set' }}</div>
              </div>
              <div class="col-6 col-sm-4">
                <div class="text-weight-medium">Age</div>
                <div>{{ personalDataStore.personalData.age ? `${personalDataStore.personalData.age} years` : 'Not set' }}</div>
              </div>
              <div class="col-6 col-sm-4">
                <div class="text-weight-medium">Height</div>
                <div>{{ personalDataStore.personalData.height ? `${personalDataStore.personalData.height} cm` : 'Not set' }}</div>
              </div>
              <div class="col-6 col-sm-4">
                <div class="text-weight-medium">Weight</div>
                <div>{{ personalDataStore.personalData.weight ? `${personalDataStore.personalData.weight} kg` : 'Not set' }}</div>
              </div>
              <div class="col-6 col-sm-4">
                <div class="text-weight-medium">BMI</div>
                <div :class="getBMIColor(personalDataStore.getBMI())">
                  {{ personalDataStore.getBMI() || 'Not calculated' }}
                </div>
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { usePersonalDataStore } from 'src/stores/personal-data-store'
import { useQuasar } from 'quasar'

const $q = useQuasar()
const personalDataStore = usePersonalDataStore()

// Form data
const form = ref({
  name: '',
  sex: '',
  age: null,
  height: null,
  weight: null
})

const saving = ref(false)

// Sex options
const sexOptions = [
  { label: 'Male', value: 'male' },
  { label: 'Female', value: 'female' },
  { label: 'Other', value: 'other' }
]

// Computed properties
const hasExistingData = computed(() => {
  return personalDataStore.personalData.name ||
         personalDataStore.personalData.sex ||
         personalDataStore.personalData.age ||
         personalDataStore.personalData.height ||
         personalDataStore.personalData.weight
})

const calculatedBMI = computed(() => {
  if (form.value.weight && form.value.height) {
    const heightInMeters = form.value.height / 100
    return (form.value.weight / (heightInMeters * heightInMeters)).toFixed(1)
  }
  return null
})

// BMI helper functions
const getBMICategory = (bmi) => {
  if (!bmi) return ''
  const bmiNum = parseFloat(bmi)
  if (bmiNum < 18.5) return 'Underweight'
  if (bmiNum < 25) return 'Normal weight'
  if (bmiNum < 30) return 'Overweight'
  return 'Obese'
}

const getBMIColor = (bmi) => {
  if (!bmi) return ''
  const bmiNum = parseFloat(bmi)
  if (bmiNum < 18.5) return 'text-blue'
  if (bmiNum < 25) return 'text-green'
  if (bmiNum < 30) return 'text-orange'
  return 'text-red'
}

// Methods
const savePersonalData = async () => {
  saving.value = true
  try {
    personalDataStore.updatePersonalData(form.value)

    $q.notify({
      type: 'positive',
      message: 'Personal information saved successfully!',
      icon: 'check_circle'
    })
  } catch (err) {
    console.error('Error saving personal data:', err)
    $q.notify({
      type: 'negative',
      message: 'Failed to save personal information',
      icon: 'error'
    })
  } finally {
    saving.value = false
  }
}

const clearData = () => {
  $q.dialog({
    title: 'Clear Personal Data',
    message: 'Are you sure you want to clear all personal information? This action cannot be undone.',
    cancel: true,
    persistent: true
  }).onOk(() => {
    personalDataStore.clearPersonalData()
    form.value = {
      name: '',
      sex: '',
      age: null,
      height: null,
      weight: null
    }

    $q.notify({
      type: 'info',
      message: 'Personal data cleared',
      icon: 'info'
    })
  })
}

const loadExistingData = () => {
  const existing = personalDataStore.getPersonalData()
  console.log('Loading existing data:', existing)
  form.value = {
    name: existing.name || '',
    sex: existing.sex || '',
    age: existing.age || null,
    height: existing.height || null,
    weight: existing.weight || null
  }
  console.log('Form updated:', form.value)
}

// Lifecycle
onMounted(async () => {
  personalDataStore.initialize()
  // Wait for the next tick to ensure store is fully initialized
  await nextTick()
  loadExistingData()
})

// Watch for changes in store and update form
watch(() => personalDataStore.personalData, (newData) => {
  console.log('Store data changed:', newData)
  loadExistingData()
}, { deep: true, immediate: true })
</script>

<style scoped>
.q-card {
  max-width: 100%;
}
</style>
