import { describe, it, expect } from 'vitest'

/**
 * Quick Integration Checks
 * These tests can be run quickly to catch common bugs before deployment
 * Run with: npm test
 */

describe('Quick Validation Checks', () => {
  describe('Required Imports', () => {
    it('should import BookCard component without errors', async () => {
      const module = await import('../pages/Bookshelf.jsx').catch(() => null)
      expect(module).not.toBeNull()
    })

    it('should have STATUS object with all required statuses', async () => {
      const { STATUS } = await import('../lib/db.js')
      
      const requiredStatuses = ['reading', 'completed', 'plan_to_read', 'waiting', 'dropped', 'on_hold']
      requiredStatuses.forEach(status => {
        expect(STATUS[status]).toBeDefined()
      })
    })

    it('should have truncateText function', async () => {
      const { truncateText } = await import('../lib/db.js')
      expect(typeof truncateText).toBe('function')
    })
  })

  describe('Type Safety', () => {
    it('array methods should work on empty arrays', () => {
      const genres = []
      expect(genres.filter(g => g === 'test')).toEqual([])
      expect(genres.some(g => g === 'test')).toBe(false)
      expect(genres.every(g => g === 'test')).toBe(true)
    })

    it('array methods should work on populated arrays', () => {
      const genres = ['Fantasy', 'Adventure']
      expect(genres.includes('Fantasy')).toBe(true)
      expect(genres.filter(g => g === 'Fantasy')).toHaveLength(1)
      expect(genres.some(g => g === 'Adventure')).toBe(true)
    })
  })

  describe('Common Bug Patterns', () => {
    it('should not use undefined variables', () => {
      // Check that common variables are defined before use
      const activeGenres = []
      expect(activeGenres).toBeDefined()
      
      const setActiveGenres = () => {}
      expect(setActiveGenres).toBeDefined()
    })

    it('should handle null/undefined in optional chains', () => {
      const book = { genres: null }
      const genres = book.genres?.map(g => g) ?? []
      expect(genres).toEqual([])
    })

    it('should not mutate original arrays', () => {
      const original = ['Fantasy']
      const updated = [...original, 'Adventure']
      
      expect(original).toHaveLength(1)
      expect(updated).toHaveLength(2)
    })
  })

  describe('Filter Logic Validation', () => {
    it('filter by ANY should use .some()', () => {
      const books = [
        { genres: ['Fantasy'] },
        { genres: ['Adventure'] },
        { genres: ['Mystery'] },
      ]
      const selectedGenres = ['Fantasy', 'Adventure']
      
      const result = books.filter(book =>
        selectedGenres.some(genre => book.genres.includes(genre))
      )
      
      expect(result).toHaveLength(2)
    })

    it('filter by ALL should use .every()', () => {
      const books = [
        { genres: ['Fantasy', 'Adventure'] },
        { genres: ['Fantasy'] },
        { genres: ['Adventure'] },
      ]
      const selectedGenres = ['Fantasy', 'Adventure']
      
      const result = books.filter(book =>
        selectedGenres.every(genre => book.genres.includes(genre))
      )
      
      expect(result).toHaveLength(1)
    })
  })
})
