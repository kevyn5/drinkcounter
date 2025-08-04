<template>
  <q-page class="q-pa-sm q-pa-md-md">
    <!-- Header -->
    <div class="q-mb-sm q-mb-md-md">
      <h4 class="text-center q-my-sm q-my-md-md">Drink Counter Calendar</h4>
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
              class="full-width drink-calendar"
              :landscape="$q.screen.gt.xs"
            />
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

      <!-- Right Column: Beverage Guide and Counter -->
      <div class="col-12 col-lg-4">
        <!-- Beverage Reference Guide - Mobile Optimized -->
        <q-card class="q-mb-md">
          <q-card-section class="q-pa-sm q-pa-md-md">
            <h6 class="q-my-xs q-my-sm-md text-center">Beverage Guide</h6>

            <!-- Mobile: Card List View -->
            <div v-if="$q.screen.lt.md" class="q-gutter-xs">
              <q-card
                v-for="(beverage, index) in beverageData"
                :key="beverage.id"
                flat
                bordered
                class="cursor-pointer draggable-card"
                draggable="true"
                @dragstart="startDrag($event, index)"
                @dragover.prevent="onDragOver($event)"
                @drop="onDrop($event, index)"
                @dragend="onDragEnd($event)"
                @dblclick="editBeverage(beverage)"
              >
                <q-card-section class="q-pa-sm">
                  <div class="row items-center">
                    <div class="col-8">
                      <div class="text-weight-medium text-body2">{{ beverage.name }}</div>
                      <div class="text-caption text-grey-6">
                        {{ beverage.volume }} • {{ beverage.alcoholPercent }}% • {{ beverage.standardDrinks }} std • {{ beverage.calories }} cal
                      </div>
                    </div>
                    <div class="col-4 text-right">
                      <q-btn
                        flat
                        round
                        color="primary"
                        icon="edit"
                        size="sm"
                        @click.stop="editBeverage(beverage)"
                      />
                      <q-btn
                        v-if="beverage.type === 'Custom'"
                        flat
                        round
                        color="negative"
                        icon="delete"
                        size="sm"
                        @click.stop="deleteCustomBeverage(beverage.id)"
                      />
                    </div>
                  </div>
                </q-card-section>
              </q-card>
            </div>

            <!-- Desktop: Table View -->
            <q-table
              v-else
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
          </q-card-section>
        </q-card>

        <!-- Add Custom Beverage Button -->
        <div class="text-center q-mb-md">
          <q-btn
            color="primary"
            icon="add"
            :label="$q.screen.lt.md ? 'Add Beverage' : 'Add Custom Beverage'"
            @click="openAddBeverageDialog"
            outline
            :size="$q.screen.lt.md ? 'md' : 'lg'"
          />
        </div>

        <!-- Reset Button -->
        <div class="text-center">
          <q-btn
            color="grey"
            icon="restore"
            :label="$q.screen.lt.md ? 'Reset' : 'Reset to Defaults'"
            @click="resetOriginalBeverages"
            flat
            :size="$q.screen.lt.md ? 'sm' : 'md'"
          />
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
              label="Volume (e.g., '355ml', '12 fl oz (355ml)') *"
              lazy-rules
              :rules="[ val => val && val.length > 0 || 'Please enter volume']"
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
