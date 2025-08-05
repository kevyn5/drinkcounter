import { defineStore } from 'pinia'

export const useDrinksStore = defineStore('drinks', {
  state: () => ({
    drinkCounters: {}, // Will store: { "2024/08/05": { count: 3, beverages: [{ id: 1, name: "Beer", count: 2 }, { id: 5, name: "Spirits", count: 1 }] } }
    beverageDatabase: [] // Will store all beverages (predefined + custom)
  }),

  getters: {
    // Calculate standard drinks based on volume (ml) and alcohol percentage
    calculateStandardDrinks: () => {
      return (volumeMl, alcoholPercent) => {
        // Standard drink formula: (Volume in ml × Alcohol % × 0.789) / 10
        // 0.789 is the density of ethanol, 10g is one standard drink
        const pureAlcoholGrams = (volumeMl * alcoholPercent * 0.789) / 100
        const standardDrinks = pureAlcoholGrams / 10
        return Math.round(standardDrinks * 10) / 10 // Round to 1 decimal place
      }
    },

    // Helper to extract volume in ml from volume string (ml only)
    extractVolumeInMl: () => {
      return (volumeString) => {
        if (!volumeString || typeof volumeString !== 'string') {
          return 0
        }

        // If it's just a number, assume it's ml
        const trimmed = volumeString.trim()
        if (/^\d+(\.\d+)?$/.test(trimmed)) {
          return parseFloat(trimmed)
        }

        // Extract ml from strings like "355ml" or "355 ml"
        const mlMatch = volumeString.match(/(\d+(?:\.\d+)?)\s*ml/i)
        if (mlMatch) {
          return parseFloat(mlMatch[1])
        }

        // Return 0 if no valid ml format found
        return 0
      }
    },

    getDrinkCount: (state) => {
      return (dateKey) => {
        const dateData = state.drinkCounters[dateKey]
        if (!dateData) return 0

        // Handle old format (number) - assume 1 standard drink each
        if (typeof dateData === 'number') return dateData

        // New format - calculate total standard drinks
        if (dateData.beverages && dateData.beverages.length > 0) {
          return dateData.beverages.reduce((total, beverage) => {
            return total + (beverage.count * beverage.standardDrinks)
          }, 0)
        }

        // Fallback to count if no beverages data
        return dateData.count || 0
      }
    },

    // Get total standard drinks for a specific date (same as getDrinkCount now)
    getStandardDrinks: (state) => {
      return (dateKey) => {
        const dateData = state.drinkCounters[dateKey]
        if (!dateData) return 0

        // Handle old format (number) - assume 1 standard drink each
        if (typeof dateData === 'number') return dateData

        // New format - calculate total standard drinks
        if (dateData.beverages && dateData.beverages.length > 0) {
          return dateData.beverages.reduce((total, beverage) => {
            return total + (beverage.count * beverage.standardDrinks)
          }, 0)
        }

        return dateData.count || 0
      }
    },

    // Get beverage breakdown for a specific date
    getDateBeverages: (state) => {
      return (dateKey) => {
        const dateData = state.drinkCounters[dateKey]
        if (!dateData || typeof dateData === 'number') return []
        return dateData.beverages || []
      }
    },

    // Debug getter to inspect all stored data
    getAllData: (state) => {
      return state.drinkCounters
    },

    // Get all dates for a specific month (returns standard drinks, not beverage count)
    getMonthData: (state) => {
      return (year, month) => {
        const monthPrefix = `${year}/${month}/`
        const monthData = {}
        Object.keys(state.drinkCounters).forEach(dateKey => {
          if (dateKey.startsWith(monthPrefix)) {
            const dateData = state.drinkCounters[dateKey]

            let standardDrinks = 0
            // Handle old format (number) - assume 1 standard drink each
            if (typeof dateData === 'number') {
              standardDrinks = dateData
            } else if (dateData.beverages && dateData.beverages.length > 0) {
              // New format - calculate total standard drinks
              standardDrinks = dateData.beverages.reduce((total, beverage) => {
                return total + (beverage.count * beverage.standardDrinks)
              }, 0)
            } else {
              standardDrinks = dateData.count || 0
            }

            if (standardDrinks > 0) {
              monthData[dateKey] = standardDrinks
            }
          }
        })
        return monthData
      }
    },

    // Get all beverages from the database
    getAllBeverages: (state) => {
      return state.beverageDatabase
    },

    // Convenient getter for beverages (alias for getAllBeverages)
    beverages: (state) => {
      return state.beverageDatabase
    },

    // Get statistics for a specific month
    getMonthStatistics: (state) => {
      return (year, month) => {
        const monthStr = String(month).padStart(2, '0')
        const monthPrefix = `${year}/${monthStr}/`
        let totalStandardDrinks = 0
        let totalCalories = 0
        let daysWithDrinks = 0

        Object.keys(state.drinkCounters).forEach(dateKey => {
          if (dateKey.startsWith(monthPrefix)) {
            const dateData = state.drinkCounters[dateKey]
            let dailyStandardDrinks = 0
            let dailyCalories = 0

            // Handle old format (number) - assume 1 standard drink each, estimate calories
            if (typeof dateData === 'number') {
              dailyStandardDrinks = dateData
              dailyCalories = dateData * 150 // Rough estimate: 150 calories per standard drink
            } else if (dateData.beverages && dateData.beverages.length > 0) {
              // New format - calculate actual values
              dateData.beverages.forEach(beverage => {
                dailyStandardDrinks += beverage.count * beverage.standardDrinks

                // Find the beverage in database to get calories
                const beverageInfo = state.beverageDatabase.find(b => b.id === beverage.id)
                if (beverageInfo) {
                  dailyCalories += beverage.count * beverageInfo.calories
                } else {
                  // Fallback for generic drinks or missing beverages
                  dailyCalories += beverage.count * beverage.standardDrinks * 150
                }
              })
            } else if (dateData.count) {
              dailyStandardDrinks = dateData.count
              dailyCalories = dateData.count * 150
            }

            if (dailyStandardDrinks > 0) {
              totalStandardDrinks += dailyStandardDrinks
              totalCalories += dailyCalories
              daysWithDrinks++
            }
          }
        })

        // Get number of days in the month for average calculations
        const daysInMonth = new Date(parseInt(year), parseInt(month), 0).getDate()

        return {
          totalStandardDrinks: Math.round(totalStandardDrinks * 10) / 10,
          totalCalories: Math.round(totalCalories),
          daysWithDrinks,
          daysInMonth,
          averageStandardDrinksPerDay: daysWithDrinks > 0 ? Math.round((totalStandardDrinks / daysInMonth) * 10) / 10 : 0,
          averageCaloriesPerDay: daysWithDrinks > 0 ? Math.round(totalCalories / daysInMonth) : 0,
          averageStandardDrinksPerDrinkingDay: daysWithDrinks > 0 ? Math.round((totalStandardDrinks / daysWithDrinks) * 10) / 10 : 0
        }
      }
    },

    // Get original predefined beverages
    getOriginalBeverages: () => {
      // Helper functions (duplicated to avoid circular reference issues)
      const extractVolumeInMl = (volumeString) => {
        if (!volumeString || typeof volumeString !== 'string') {
          return 0
        }

        // If it's just a number, assume it's ml
        const trimmed = volumeString.trim()
        if (/^\d+(\.\d+)?$/.test(trimmed)) {
          return parseFloat(trimmed)
        }

        // Extract ml from strings like "355ml" or "355 ml"
        const mlMatch = volumeString.match(/(\d+(?:\.\d+)?)\s*ml/i)
        if (mlMatch) {
          return parseFloat(mlMatch[1])
        }

        return 0
      }

      const calculateStandardDrinks = (volumeMl, alcoholPercent) => {
        // Standard drink formula: (Volume in ml × Alcohol % × 0.789) / 10
        // 0.789 is the density of ethanol, 10g is one standard drink
        const pureAlcoholGrams = (volumeMl * alcoholPercent * 0.789) / 100
        const standardDrinks = pureAlcoholGrams / 10
        return Math.round(standardDrinks * 10) / 10 // Round to 1 decimal place
      }

      const beverages = [
        {
          id: 1,
          name: 'Beer (Regular)',
          type: 'Beer',
          volume: '355ml',
          alcoholPercent: 5.0,
          calories: 150,
          description: 'Regular beer, lager, or ale',
          isOriginal: true
        },
        {
          id: 2,
          name: 'Beer (Light)',
          type: 'Beer',
          volume: '355ml',
          alcoholPercent: 4.2,
          calories: 110,
          description: 'Light beer with reduced alcohol',
          isOriginal: true
        },
        {
          id: 3,
          name: 'Wine (Red/White)',
          type: 'Wine',
          volume: '148ml',
          alcoholPercent: 12.0,
          calories: 125,
          description: 'Standard table wine',
          isOriginal: true
        },
        {
          id: 4,
          name: 'Wine (Fortified)',
          type: 'Wine',
          volume: '104ml',
          alcoholPercent: 17.0,
          calories: 165,
          description: 'Port, sherry, or dessert wine',
          isOriginal: true
        },
        {
          id: 5,
          name: 'Spirits (80 proof)',
          type: 'Spirits',
          volume: '44ml',
          alcoholPercent: 40.0,
          calories: 96,
          description: 'Vodka, whiskey, rum, gin (80 proof)',
          isOriginal: true
        },
        {
          id: 6,
          name: 'Cocktail (Margarita)',
          type: 'Cocktail',
          volume: '118ml',
          alcoholPercent: 18.0,
          calories: 280,
          description: 'Mixed drink with tequila, triple sec, lime',
          isOriginal: true
        },
        {
          id: 7,
          name: 'Cocktail (Manhattan)',
          type: 'Cocktail',
          volume: '104ml',
          alcoholPercent: 30.0,
          calories: 190,
          description: 'Whiskey, sweet vermouth, bitters',
          isOriginal: true
        },
        {
          id: 8,
          name: 'Hard Seltzer',
          type: 'Seltzer',
          volume: '355ml',
          alcoholPercent: 5.0,
          calories: 100,
          description: 'Flavored alcoholic seltzer water',
          isOriginal: true
        }
      ]

      // Calculate standard drinks for each beverage based on volume and alcohol %
      return beverages.map(beverage => {
        const volumeMl = extractVolumeInMl(beverage.volume)
        const standardDrinks = calculateStandardDrinks(volumeMl, beverage.alcoholPercent)
        return {
          ...beverage,
          standardDrinks
        }
      })
    }
  },

  actions: {
    // Add a specific beverage to a date
    addBeverage(dateKey, beverage) {
      // Validate dateKey format
      if (!dateKey || dateKey === 'null' || !dateKey.match(/^\d{4}\/\d{2}\/\d{2}$/)) {
        console.error(`Invalid date key: "${dateKey}"`)
        return
      }

      if (!beverage || !beverage.id) {
        console.error('Invalid beverage data')
        return
      }

      // Initialize date data if it doesn't exist
      if (!this.drinkCounters[dateKey]) {
        this.drinkCounters[dateKey] = { count: 0, beverages: [] }
      }

      // Handle migration from old format (number) to new format (object)
      if (typeof this.drinkCounters[dateKey] === 'number') {
        const oldCount = this.drinkCounters[dateKey]
        this.drinkCounters[dateKey] = { count: oldCount, beverages: [] }
      }

      const dateData = this.drinkCounters[dateKey]

      // Find existing beverage or create new entry
      const existingBeverage = dateData.beverages.find(b => b.id === beverage.id)
      if (existingBeverage) {
        existingBeverage.count++
      } else {
        dateData.beverages.push({
          id: beverage.id,
          name: beverage.name,
          type: beverage.type,
          standardDrinks: beverage.standardDrinks,
          count: 1
        })
      }

      // Update total count (now represents total standard drinks)
      const totalStandardDrinks = dateData.beverages.reduce((total, b) => {
        return total + (b.count * b.standardDrinks)
      }, 0)
      dateData.count = totalStandardDrinks

      this.saveToLocalStorage()
    },

    // Remove a specific beverage from a date
    removeBeverage(dateKey, beverageId) {
      // Validate dateKey format
      if (!dateKey || dateKey === 'null' || !dateKey.match(/^\d{4}\/\d{2}\/\d{2}$/)) {
        console.error(`Invalid date key: "${dateKey}"`)
        return
      }

      const dateData = this.drinkCounters[dateKey]
      if (!dateData || typeof dateData === 'number') return

      const beverageIndex = dateData.beverages.findIndex(b => b.id === beverageId)
      if (beverageIndex === -1) return

      const beverage = dateData.beverages[beverageIndex]
      beverage.count--

      // Remove beverage if count reaches 0
      if (beverage.count <= 0) {
        dateData.beverages.splice(beverageIndex, 1)
      }

      // Update total count to reflect standard drinks
      const totalStandardDrinks = dateData.beverages.reduce((total, b) => {
        return total + (b.count * b.standardDrinks)
      }, 0)
      dateData.count = totalStandardDrinks

      // Remove entire date entry if no drinks left
      if (dateData.count <= 0) {
        delete this.drinkCounters[dateKey]
      }

      this.saveToLocalStorage()
    },

    // Legacy methods for backward compatibility
    incrementDrinkCount(dateKey) {
      console.log('incrementDrinkCount called with dateKey:', dateKey)

      // Validate dateKey format
      if (!dateKey || dateKey === 'null' || !dateKey.match(/^\d{4}\/\d{2}\/\d{2}$/)) {
        console.error(`Invalid date key: "${dateKey}"`)
        return
      }

      // Initialize or migrate data
      if (!this.drinkCounters[dateKey]) {
        this.drinkCounters[dateKey] = { count: 0, beverages: [] }
      } else if (typeof this.drinkCounters[dateKey] === 'number') {
        const oldCount = this.drinkCounters[dateKey]
        this.drinkCounters[dateKey] = { count: oldCount, beverages: [] }
      }

      // Add 1 standard drink (generic beverage)
      const dateData = this.drinkCounters[dateKey]

      // Find or create a generic "Standard Drink" entry
      const genericBeverage = dateData.beverages.find(b => b.id === 'generic')
      if (genericBeverage) {
        genericBeverage.count++
      } else {
        dateData.beverages.push({
          id: 'generic',
          name: 'Standard Drink',
          type: 'Generic',
          standardDrinks: 1.0,
          count: 1
        })
      }

      // Update total count to reflect standard drinks
      const totalStandardDrinks = dateData.beverages.reduce((total, b) => {
        return total + (b.count * b.standardDrinks)
      }, 0)
      dateData.count = totalStandardDrinks

      console.log('After increment:', { dateKey, totalStandardDrinks, dateData })

      this.saveToLocalStorage()
    },

    decrementDrinkCount(dateKey) {
      // Validate dateKey format
      if (!dateKey || dateKey === 'null' || !dateKey.match(/^\d{4}\/\d{2}\/\d{2}$/)) {
        console.error(`Invalid date key: "${dateKey}"`)
        return
      }

      const dateData = this.drinkCounters[dateKey]
      if (!dateData) return

      // Handle old format (number)
      if (typeof dateData === 'number') {
        if (dateData > 0) {
          const newCount = dateData - 1
          if (newCount <= 0) {
            delete this.drinkCounters[dateKey]
          } else {
            this.drinkCounters[dateKey] = newCount
          }
        }
      } else {
        // New format - remove 1 standard drink (prefer generic drinks first)
        const genericBeverage = dateData.beverages.find(b => b.id === 'generic')
        if (genericBeverage && genericBeverage.count > 0) {
          // Remove from generic drinks first
          genericBeverage.count--
          if (genericBeverage.count <= 0) {
            const index = dateData.beverages.findIndex(b => b.id === 'generic')
            dateData.beverages.splice(index, 1)
          }
        } else if (dateData.beverages.length > 0) {
          // If no generic drinks, remove from the last beverage added
          const lastBeverage = dateData.beverages[dateData.beverages.length - 1]
          lastBeverage.count--
          if (lastBeverage.count <= 0) {
            dateData.beverages.splice(dateData.beverages.length - 1, 1)
          }
        }

        // Update total count to reflect standard drinks
        if (dateData.beverages.length > 0) {
          const totalStandardDrinks = dateData.beverages.reduce((total, b) => {
            return total + (b.count * b.standardDrinks)
          }, 0)
          dateData.count = totalStandardDrinks
        } else {
          // No beverages left, remove the entire date entry
          delete this.drinkCounters[dateKey]
        }
      }

      this.saveToLocalStorage()
    },

    // Beverage database management actions
    addCustomBeverage(beverage) {
      // Generate a unique ID
      const maxId = Math.max(...this.beverageDatabase.map(b => b.id), 0)
      const newBeverage = {
        ...beverage,
        id: maxId + 1,
        type: 'Custom',
        isOriginal: false
      }
      this.beverageDatabase.push(newBeverage)
      this.saveBeveragesToLocalStorage()
    },

    updateBeverage(beverageId, updatedData) {
      const index = this.beverageDatabase.findIndex(b => b.id === beverageId)
      if (index !== -1) {
        this.beverageDatabase[index] = {
          ...this.beverageDatabase[index],
          ...updatedData
        }
        this.saveBeveragesToLocalStorage()
      }
    },

    deleteBeverage(beverageId) {
      const index = this.beverageDatabase.findIndex(b => b.id === beverageId)
      if (index !== -1) {
        const beverage = this.beverageDatabase[index]
        // Only allow deletion of custom beverages
        if (beverage.type === 'Custom') {
          this.beverageDatabase.splice(index, 1)
          this.saveBeveragesToLocalStorage()
        }
      }
    },

    resetOriginalBeverages() {
      // Remove all original beverages and replace with fresh copies
      this.beverageDatabase = this.beverageDatabase.filter(b => b.type === 'Custom')
      const originalBeverages = this.getOriginalBeverages
      this.beverageDatabase.unshift(...originalBeverages)
      this.saveBeveragesToLocalStorage()
    },

    reorderBeverages(newOrder) {
      // Reorder the beverage database based on the new order
      this.beverageDatabase = newOrder
      this.saveBeveragesToLocalStorage()
    },

    initializeBeverageDatabase() {
      // Load beverages from localStorage or initialize with defaults
      const saved = localStorage.getItem('beverageDatabase')
      if (saved) {
        try {
          this.beverageDatabase = JSON.parse(saved)

          // Ensure we have the original beverages (in case they were accidentally deleted)
          const hasOriginals = this.beverageDatabase.some(b => b.isOriginal)
          if (!hasOriginals) {
            const originalBeverages = this.getOriginalBeverages
            this.beverageDatabase.unshift(...originalBeverages)
            this.saveBeveragesToLocalStorage()
          }
        } catch (error) {
          console.error('Error loading beverage database:', error)
          this.beverageDatabase = this.getOriginalBeverages
          this.saveBeveragesToLocalStorage()
        }
      } else {
        // First time - initialize with original beverages
        this.beverageDatabase = this.getOriginalBeverages
        this.saveBeveragesToLocalStorage()
      }
    },

    saveBeveragesToLocalStorage() {
      localStorage.setItem('beverageDatabase', JSON.stringify(this.beverageDatabase))
    },

    saveToLocalStorage() {
      localStorage.setItem('drinkCounters', JSON.stringify(this.drinkCounters))
    },

    loadFromLocalStorage() {
      const saved = localStorage.getItem('drinkCounters')
      if (saved) {
        const loadedData = JSON.parse(saved)

        // Clean up any invalid keys and handle format migration
        const cleanedData = {}
        Object.keys(loadedData).forEach(key => {
          // Only keep valid date keys (YYYY/MM/DD format)
          if (key && key !== 'null' && key.match(/^\d{4}\/\d{2}\/\d{2}$/)) {
            const value = loadedData[key]

            // Handle both old format (number) and new format (object)
            if (typeof value === 'number') {
              // Keep old format for backward compatibility
              cleanedData[key] = value
            } else if (typeof value === 'object' && value.count !== undefined) {
              // New format with beverage details
              cleanedData[key] = {
                count: value.count || 0,
                beverages: Array.isArray(value.beverages) ? value.beverages : []
              }
            }
          } else {
            console.warn(`Removing invalid date key: "${key}"`)
          }
        })

        this.drinkCounters = cleanedData

        // Save the cleaned data back to localStorage
        this.saveToLocalStorage()
      }
    },

    initialize() {
      this.loadFromLocalStorage()
      this.initializeBeverageDatabase()
    }
  }
})
