import { renderHook, act } from '@testing-library/react'
import { useFilters } from '../useFilters'
import { useTableState } from '../useTableState'
import { useFormState } from '../useFormState'
import { useSelection } from '../useSelection'
import { vi } from 'vitest'

describe('State Management Hooks', () => {
  describe('useFilters', () => {
    it('initializes with default filters', () => {
      const { result } = renderHook(() =>
        useFilters({ status: 'ACTIVE', category: 'consulting' })
      )

      expect(result.current.filters).toEqual({
        status: 'ACTIVE',
        category: 'consulting',
      })
    })

    it('adds a filter', () => {
      const { result } = renderHook(() => useFilters({}))

      act(() => {
        result.current.addFilter('status', 'PENDING')
      })

      expect(result.current.filters.status).toBe('PENDING')
    })

    it('removes a filter', () => {
      const { result } = renderHook(() =>
        useFilters({ status: 'ACTIVE', category: 'consulting' })
      )

      act(() => {
        result.current.removeFilter('category')
      })

      expect(result.current.filters.category).toBeUndefined()
      expect(result.current.filters.status).toBe('ACTIVE')
    })

    it('clears all filters', () => {
      const { result } = renderHook(() =>
        useFilters({ status: 'ACTIVE', category: 'consulting' })
      )

      act(() => {
        result.current.clearFilters()
      })

      expect(result.current.hasFilters).toBe(false)
    })

    it('updates multiple filters at once', () => {
      const { result } = renderHook(() => useFilters({}))

      act(() => {
        result.current.updateFilters({
          status: 'PENDING',
          category: 'consulting',
        })
      })

      expect(result.current.filters).toEqual({
        status: 'PENDING',
        category: 'consulting',
      })
    })

    it('persists to localStorage when storage key provided', async () => {
      const storageKey = 'test-filters'
      vi.spyOn(Storage.prototype, 'setItem')

      const { result } = renderHook(() =>
        useFilters({ status: 'ACTIVE' }, { storageKey })
      )

      act(() => {
        result.current.addFilter('category', 'consulting')
      })

      expect(localStorage.setItem).toHaveBeenCalledWith(
        storageKey,
        expect.stringContaining('status')
      )
    })
  })

  describe('useTableState', () => {
    it('initializes with default pagination', () => {
      const { result } = renderHook(() => useTableState())

      expect(result.current.page).toBe(1)
      expect(result.current.limit).toBe(10)
      expect(result.current.sort.order).toBe('asc')
    })

    it('navigates to specific page', () => {
      const { result } = renderHook(() => useTableState())

      act(() => {
        result.current.goToPage(3)
      })

      expect(result.current.page).toBe(3)
    })

    it('changes page limit and resets to page 1', () => {
      const { result } = renderHook(() => useTableState())

      act(() => {
        result.current.goToPage(5)
        result.current.setLimit(25)
      })

      expect(result.current.limit).toBe(25)
      expect(result.current.page).toBe(1)
    })

    it('toggles sort order when clicking same column', () => {
      const { result } = renderHook(() => useTableState())

      act(() => {
        result.current.setSortBy('name')
      })

      expect(result.current.sort.column).toBe('name')
      expect(result.current.sort.order).toBe('asc')

      act(() => {
        result.current.setSortBy('name')
      })

      expect(result.current.sort.order).toBe('desc')
    })

    it('resets to initial state', () => {
      const { result } = renderHook(() =>
        useTableState({ initialPage: 5, initialLimit: 50 })
      )

      act(() => {
        result.current.goToPage(10)
        result.current.setLimit(100)
      })

      act(() => {
        result.current.reset()
      })

      expect(result.current.page).toBe(5)
      expect(result.current.limit).toBe(50)
    })

    it('calculates offset correctly', () => {
      const { result } = renderHook(() => useTableState())

      act(() => {
        result.current.goToPage(2)
        result.current.setLimit(25)
      })

      expect(result.current.offset).toBe(25) // (2-1) * 25
    })
  })

  describe('useFormState', () => {
    it('initializes with provided data', () => {
      const { result } = renderHook(() =>
        useFormState({ name: '', email: '' })
      )

      expect(result.current.data).toEqual({ name: '', email: '' })
      expect(result.current.isDirty).toBe(false)
    })

    it('tracks dirty state', () => {
      const { result } = renderHook(() =>
        useFormState({ name: '', email: '' })
      )

      act(() => {
        result.current.updateField('name', 'John')
      })

      expect(result.current.isDirty).toBe(true)
    })

    it('updates individual fields', () => {
      const { result } = renderHook(() =>
        useFormState({ name: '', email: '' })
      )

      act(() => {
        result.current.updateField('name', 'John Doe')
        result.current.updateField('email', 'john@example.com')
      })

      expect(result.current.data).toEqual({
        name: 'John Doe',
        email: 'john@example.com',
      })
    })

    it('updates multiple fields at once', () => {
      const { result } = renderHook(() =>
        useFormState({ name: '', email: '', age: 0 })
      )

      act(() => {
        result.current.updateFields({
          name: 'Jane',
          email: 'jane@example.com',
        })
      })

      expect(result.current.data.name).toBe('Jane')
      expect(result.current.data.email).toBe('jane@example.com')
      expect(result.current.data.age).toBe(0)
    })

    it('resets form to initial state', () => {
      const { result } = renderHook(() =>
        useFormState({ name: 'John', email: 'john@example.com' })
      )

      act(() => {
        result.current.updateField('name', 'Jane')
      })

      expect(result.current.isDirty).toBe(true)

      act(() => {
        result.current.reset()
      })

      expect(result.current.data.name).toBe('John')
      expect(result.current.isDirty).toBe(false)
    })

    it('handles form submission', async () => {
      const onSubmit = vi.fn().mockResolvedValueOnce(undefined)
      const { result } = renderHook(() =>
        useFormState({ name: '' }, { onSubmit })
      )

      act(() => {
        result.current.updateField('name', 'John')
      })

      await act(async () => {
        await result.current.submit()
      })

      expect(onSubmit).toHaveBeenCalledWith({ name: 'John' })
    })

    it('clears errors on field change', () => {
      const { result } = renderHook(() =>
        useFormState({ name: '', email: '' })
      )

      act(() => {
        result.current.setFieldError('email', 'Invalid email')
      })

      expect(result.current.errors.email).toBe('Invalid email')

      act(() => {
        result.current.updateField('email', 'test@example.com')
      })

      expect(result.current.errors.email).toBeUndefined()
    })
  })

  describe('useSelection', () => {
    const items = ['id-1', 'id-2', 'id-3', 'id-4']

    it('initializes with empty selection', () => {
      const { result } = renderHook(() => useSelection(items))

      expect(result.current.selectedCount).toBe(0)
      expect(result.current.isEmpty).toBe(true)
    })

    it('toggles item selection', () => {
      const { result } = renderHook(() => useSelection(items))

      act(() => {
        result.current.toggle('id-1')
      })

      expect(result.current.isSelected('id-1')).toBe(true)
      expect(result.current.selectedCount).toBe(1)

      act(() => {
        result.current.toggle('id-1')
      })

      expect(result.current.isSelected('id-1')).toBe(false)
    })

    it('toggles all items', () => {
      const { result } = renderHook(() => useSelection(items))

      act(() => {
        result.current.toggleAll()
      })

      expect(result.current.isAllSelected).toBe(true)
      expect(result.current.selectedCount).toBe(4)

      act(() => {
        result.current.toggleAll()
      })

      expect(result.current.isAllSelected).toBe(false)
      expect(result.current.isEmpty).toBe(true)
    })

    it('selects specific items', () => {
      const { result } = renderHook(() => useSelection(items))

      act(() => {
        result.current.select(['id-1', 'id-3'])
      })

      expect(result.current.selectedCount).toBe(2)
      expect(result.current.selectedItems).toEqual(['id-1', 'id-3'])
    })

    it('deselects specific items', () => {
      const { result } = renderHook(() => useSelection(items))

      act(() => {
        result.current.toggleAll()
        result.current.deselect(['id-1', 'id-2'])
      })

      expect(result.current.selectedCount).toBe(2)
      expect(result.current.unselectedItems).toEqual(['id-1', 'id-2'])
    })

    it('clears all selections', () => {
      const { result } = renderHook(() => useSelection(items))

      act(() => {
        result.current.toggleAll()
      })

      expect(result.current.hasSelection).toBe(true)

      act(() => {
        result.current.clear()
      })

      expect(result.current.isEmpty).toBe(true)
      expect(result.current.selectedCount).toBe(0)
    })

    it('tracks indeterminate state', () => {
      const { result } = renderHook(() => useSelection(items))

      act(() => {
        result.current.toggle('id-1')
        result.current.toggle('id-2')
      })

      expect(result.current.isIndeterminate).toBe(true)
      expect(result.current.isAllSelected).toBe(false)
    })
  })
})
