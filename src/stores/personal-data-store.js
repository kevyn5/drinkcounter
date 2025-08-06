import { defineStore } from 'pinia'
import { ref } from 'vue'

export const usePersonalDataStore = defineStore('personalData', () => {
  // Personal data fields - defaults to empty for user input
  const personalData = ref({
    name: '',
    sex: '', // 'male', 'female', 'other'
    weight: null, // in kg
    height: null, // in cm
    age: null // in years
  })

  // Actions
  const updatePersonalData = (data) => {
    personalData.value = { ...personalData.value, ...data }
    saveToStorage()
  }

  const saveToStorage = () => {
    try {
      localStorage.setItem('drinkcounter-personal-data', JSON.stringify(personalData.value))
    } catch (error) {
      console.error('Failed to save personal data to localStorage:', error)
    }
  }

  const loadFromStorage = () => {
    try {
      const stored = localStorage.getItem('drinkcounter-personal-data')
      console.log('Loading from localStorage:', stored)
      if (stored) {
        const parsed = JSON.parse(stored)
        console.log('Parsed personal data:', parsed)
        personalData.value = { ...personalData.value, ...parsed }
        console.log('Personal data after loading:', personalData.value)
      } else {
        // If no stored data, use empty defaults for user to fill
        console.log('No stored personal data found, using empty defaults')
        personalData.value = {
          name: '',
          sex: '',
          weight: null,
          height: null,
          age: null
        }
      }
    } catch (error) {
      console.error('Failed to load personal data from localStorage:', error)
      // On error, leave fields empty for user to fill
    }
  }

  const clearPersonalData = () => {
    personalData.value = {
      name: '',
      sex: '',
      weight: null,
      height: null,
      age: null
    }
    localStorage.removeItem('drinkcounter-personal-data')
  }

  // Computed values for health calculations
  const getBMI = () => {
    if (personalData.value.weight && personalData.value.height) {
      const heightInMeters = personalData.value.height / 100
      return (personalData.value.weight / (heightInMeters * heightInMeters)).toFixed(1)
    }
    return null
  }

  // Calculate daily calorie needs (BMR + activity)
  const getDailyCalorieNeeds = () => {
    if (!personalData.value.weight || !personalData.value.height || !personalData.value.age || !personalData.value.sex) {
      return null
    }

    const weight = personalData.value.weight
    const height = personalData.value.height
    const age = personalData.value.age
    const sex = personalData.value.sex

    // Mifflin-St Jeor Equation for BMR
    let bmr
    if (sex === 'male') {
      bmr = (10 * weight) + (6.25 * height) - (5 * age) + 5
    } else if (sex === 'female') {
      bmr = (10 * weight) + (6.25 * height) - (5 * age) - 161
    } else {
      // For 'other', use average of male/female calculations
      const maleBmr = (10 * weight) + (6.25 * height) - (5 * age) + 5
      const femaleBmr = (10 * weight) + (6.25 * height) - (5 * age) - 161
      bmr = (maleBmr + femaleBmr) / 2
    }

    // Multiply by activity factor (assuming sedentary to lightly active: 1.375)
    const dailyCalories = bmr * 1.375

    return Math.round(dailyCalories)
  }

  // Calculate alcohol calorie percentage for a month
  const getMonthlyAlcoholCaloriePercentage = (monthStats) => {
    const dailyCalorieNeeds = getDailyCalorieNeeds()
    if (!dailyCalorieNeeds || !monthStats.totalCalories) {
      return null
    }

    // Total monthly calorie needs
    const monthlyCalorieNeeds = dailyCalorieNeeds * monthStats.daysInMonth

    // Percentage of monthly calories from alcohol
    const percentage = (monthStats.totalCalories / monthlyCalorieNeeds) * 100

    return Math.round(percentage * 10) / 10 // Round to 1 decimal
  }

  // Get daily alcohol calorie percentage
  const getDailyAlcoholCaloriePercentage = (alcoholCalories) => {
    const dailyCalorieNeeds = getDailyCalorieNeeds()
    if (!dailyCalorieNeeds || !alcoholCalories) {
      return null
    }

    const percentage = (alcoholCalories / dailyCalorieNeeds) * 100
    return Math.round(percentage * 10) / 10
  }

  // Calculate potential weight gain from alcohol calories
  const getMonthlyWeightGain = (monthStats) => {
    if (!monthStats || !monthStats.totalCalories) {
      return { kg: 0, pounds: 0, calories: 0, caloriesPerDay: 0 }
    }

    // 1 kg of fat = approximately 7700 calories
    const caloriesPerKg = 7700

    // Calculate potential weight gain if all alcohol calories were excess
    const weightGainKg = monthStats.totalCalories / caloriesPerKg
    const daysInMonth = monthStats.daysInMonth || 30

    return {
      kg: Math.round(weightGainKg * 100) / 100, // Round to 2 decimal places
      pounds: Math.round((weightGainKg * 2.20462) * 100) / 100, // Convert to pounds and round
      calories: monthStats.totalCalories,
      caloriesPerDay: Math.round(monthStats.totalCalories / daysInMonth)
    }
  }

  // Calculate annual projection based on monthly average
  const getAnnualWeightGainProjection = (monthStats) => {
    const monthlyGain = getMonthlyWeightGain(monthStats)
    if (!monthlyGain || monthlyGain.kg === 0) {
      return { kg: 0, pounds: 0, calories: 0 }
    }

    return {
      kg: Math.round(monthlyGain.kg * 12 * 100) / 100,
      pounds: Math.round(monthlyGain.pounds * 12 * 100) / 100,
      calories: monthlyGain.calories * 12
    }
  }

  // Calculate daily average weight gain
  const getDailyWeightGain = (monthStats) => {
    const monthlyGain = getMonthlyWeightGain(monthStats)
    if (!monthlyGain) {
      return null
    }

    const daysInMonth = monthStats.daysInMonth || 30
    return {
      kg: Math.round((monthlyGain.kg / daysInMonth) * 1000) / 1000, // Round to 3 decimal places (grams precision)
      pounds: Math.round((monthlyGain.pounds / daysInMonth) * 1000) / 1000,
      grams: Math.round(monthlyGain.kg * 1000 / daysInMonth) // Convert to grams for easier reading
    }
  }

  // Initialize store
  const initialize = () => {
    loadFromStorage()
  }

  // Calculate BMR (Basal Metabolic Rate) only
  const getBMR = () => {
    if (!personalData.value.weight || !personalData.value.height || !personalData.value.age || !personalData.value.sex) {
      return null
    }

    const weight = personalData.value.weight
    const height = personalData.value.height
    const age = personalData.value.age
    const sex = personalData.value.sex

    // Mifflin-St Jeor Equation for BMR
    let bmr
    if (sex === 'male') {
      bmr = (10 * weight) + (6.25 * height) - (5 * age) + 5
    } else if (sex === 'female') {
      bmr = (10 * weight) + (6.25 * height) - (5 * age) - 161
    } else {
      // For 'other', use average of male/female calculations
      const maleBmr = (10 * weight) + (6.25 * height) - (5 * age) + 5
      const femaleBmr = (10 * weight) + (6.25 * height) - (5 * age) - 161
      bmr = (maleBmr + femaleBmr) / 2
    }

    return Math.round(bmr)
  }

  // Getters
  const getPersonalData = () => personalData.value
  const isDataComplete = () => {
    return personalData.value.name &&
           personalData.value.sex &&
           personalData.value.weight &&
           personalData.value.height &&
           personalData.value.age
  }

  return {
    // State
    personalData,

    // Actions
    updatePersonalData,
    clearPersonalData,
    initialize,

    // Getters
    getPersonalData,
    getBMI,
    getBMR,
    isDataComplete,
    getDailyCalorieNeeds,
    getMonthlyAlcoholCaloriePercentage,
    getDailyAlcoholCaloriePercentage,
    getMonthlyWeightGain,
    getAnnualWeightGainProjection,
    getDailyWeightGain
  }
})
