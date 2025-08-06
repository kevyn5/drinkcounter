<template>
  <q-page padding>
    <div class="row justify-center">
      <div class="col-12 col-md-8 col-lg-6">
        <q-card class="q-mb-md">
          <q-card-section>
            <div class="text-h5 q-mb-md">
              <q-icon name="settings" class="q-mr-sm" />
              Settings
            </div>

            <q-separator class="q-mb-md" />

            <!-- Beverage Management Section -->
            <div class="q-mb-lg">
              <div class="text-h6 q-mb-md">
                <q-icon name="local_bar" class="q-mr-sm" />
                Beverage Management
              </div>

              <div class="q-mb-md text-body2 text-grey-7">
                Manage your beverage reference guide and reset to default beverages.
              </div>

              <q-btn
                color="orange"
                icon="refresh"
                label="Reset Beverage Guide to Defaults"
                @click="showResetDialog = true"
                outline
                class="full-width"
              />

              <div class="q-mt-sm text-caption text-grey-6">
                This will restore the original beverage database and remove all customizations.
              </div>
            </div>

            <!-- Data Management Section -->
            <div class="q-mb-lg">
              <div class="text-h6 q-mb-md">
                <q-icon name="storage" class="q-mr-sm" />
                Data Management
              </div>

              <div class="q-mb-md text-body2 text-grey-7">
                Backup and restore your drinking data and beverage settings.
              </div>

              <div class="row q-gutter-sm">
                <div class="col">
                  <q-btn
                    color="positive"
                    icon="download"
                    label="Export Data"
                    @click="exportData"
                    outline
                    class="full-width"
                  />
                </div>
                <div class="col">
                  <q-btn
                    color="primary"
                    icon="upload"
                    label="Import Data"
                    @click="$refs.fileInput.click()"
                    outline
                    class="full-width"
                  />
                </div>
              </div>
            </div>

            <!-- App Information Section -->
            <div>
              <div class="text-h6 q-mb-md">
                <q-icon name="info" class="q-mr-sm" />
                App Information
              </div>

              <div class="text-body2 text-grey-7 q-mb-sm">
                Version: 1.1
              </div>

              <div class="text-body2 text-grey-7">
                A drink tracking calendar application to help monitor alcohol consumption and health metrics.
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- Hidden file input for import -->
    <input
      ref="fileInput"
      type="file"
      accept=".json"
      style="display: none"
      @change="importData"
    />

    <!-- Reset Confirmation Dialog -->
    <q-dialog v-model="showResetDialog" persistent>
      <q-card>
        <q-card-section class="row items-center">
          <q-avatar icon="warning" color="orange" text-color="white" />
          <span class="q-ml-sm text-h6">Reset Beverage Guide?</span>
        </q-card-section>

        <q-card-section>
          <p>This action will:</p>
          <ul class="q-ml-md">
            <li>Restore the original default beverages</li>
            <li>Remove all custom beverages you've created</li>
            <li>Reset any modifications to default beverages</li>
            <li>Remove any beverages you've deleted from the defaults</li>
          </ul>
          <p><strong>This action cannot be undone.</strong></p>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancel" color="primary" v-close-popup />
          <q-btn
            flat
            label="Reset to Defaults"
            color="orange"
            @click="resetToDefaults"
            v-close-popup
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref } from 'vue'
import { useQuasar } from 'quasar'
import { useDrinksStore } from 'src/stores/drinks-store'
import { usePersonalDataStore } from 'src/stores/personal-data-store'

const $q = useQuasar()
const drinksStore = useDrinksStore()
const personalDataStore = usePersonalDataStore()

const showResetDialog = ref(false)
const fileInput = ref(null)

const resetToDefaults = () => {
  try {
    // Clear custom defaults and reset to original beverages
    drinksStore.clearCustomDefaults()
    drinksStore.resetToOriginalBeverages()

    $q.notify({
      type: 'positive',
      message: 'Beverage guide has been reset to defaults',
      timeout: 3000
    })
  } catch (error) {
    console.error('Error resetting beverages:', error)
    $q.notify({
      type: 'negative',
      message: 'Error resetting beverage guide',
      timeout: 3000
    })
  }
}

const exportData = () => {
  try {
    // Create export object with all app data
    const exportData = {
      version: '1.1',
      timestamp: new Date().toISOString(),
      drinkCounters: drinksStore.getAllData,
      beverageDatabase: drinksStore.beverages,
      personalData: {
        name: personalDataStore.name,
        age: personalDataStore.age,
        gender: personalDataStore.gender,
        weight: personalDataStore.weight,
        height: personalDataStore.height
      }
    }

    // Create and download JSON file
    const dataStr = JSON.stringify(exportData, null, 2)
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr)

    const exportFileDefaultName = `drink-calendar-export-${new Date().toISOString().split('T')[0]}.json`

    const linkElement = document.createElement('a')
    linkElement.setAttribute('href', dataUri)
    linkElement.setAttribute('download', exportFileDefaultName)
    linkElement.click()

    $q.notify({
      type: 'positive',
      message: 'Data exported successfully',
      timeout: 3000
    })
  } catch (error) {
    console.error('Error exporting data:', error)
    $q.notify({
      type: 'negative',
      message: 'Error exporting data',
      timeout: 3000
    })
  }
}

const importData = (event) => {
  const file = event.target.files[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const importedData = JSON.parse(e.target.result)

      // Validate the import data structure
      if (!importedData.version || !importedData.drinkCounters || !importedData.beverageDatabase) {
        throw new Error('Invalid data format')
      }

      // Confirm import
      $q.dialog({
        title: 'Import Data',
        message: 'This will replace all your current data. Are you sure you want to continue?',
        persistent: true,
        ok: {
          push: true,
          color: 'primary',
          label: 'Import'
        },
        cancel: {
          push: true,
          color: 'negative',
          label: 'Cancel'
        }
      }).onOk(() => {
        // Import the data
        if (importedData.drinkCounters) {
          drinksStore.$state.drinkCounters = importedData.drinkCounters
          drinksStore.saveToLocalStorage()
        }

        if (importedData.beverageDatabase) {
          drinksStore.$state.beverageDatabase = importedData.beverageDatabase
          drinksStore.saveBeveragesToLocalStorage()
        }

        if (importedData.personalData) {
          personalDataStore.name = importedData.personalData.name || ''
          personalDataStore.age = importedData.personalData.age || null
          personalDataStore.gender = importedData.personalData.gender || null
          personalDataStore.weight = importedData.personalData.weight || null
          personalDataStore.height = importedData.personalData.height || null
        }

        $q.notify({
          type: 'positive',
          message: 'Data imported successfully',
          timeout: 3000
        })
      })
    } catch (error) {
      console.error('Error importing data:', error)
      $q.notify({
        type: 'negative',
        message: 'Error importing data: Invalid file format',
        timeout: 3000
      })
    }
  }
  reader.readAsText(file)

  // Clear the input value so the same file can be selected again
  event.target.value = ''
}
</script>
