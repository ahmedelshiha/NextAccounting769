import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LanguagesTab } from '../tabs/LanguagesTab'
import { LocalizationProvider } from '../LocalizationProvider'
import { vi } from 'vitest'

// Mock dependencies
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

vi.mock('@/components/PermissionGate', () => ({
  default: ({ children }: any) => <div>{children}</div>,
}))

vi.mock('@/components/admin/settings/FormField', () => ({
  TextField: ({ label, value, onChange, placeholder }: any) => (
    <input
      placeholder={placeholder}
      value={value}
      onChange={e => onChange(e.target.value)}
      aria-label={label}
    />
  ),
  SelectField: ({ label, value, onChange, options }: any) => (
    <select value={value} onChange={e => onChange(e.target.value)} aria-label={label}>
      {options.map((opt: any) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  ),
  Toggle: ({ value, onChange }: any) => (
    <input type="checkbox" checked={value} onChange={e => onChange(e.target.checked)} />
  ),
}))

// Mock useFormMutation to capture mutate calls
const mutateMock = vi.fn(() => Promise.resolve({ ok: true, data: {} }))
vi.mock('../hooks/useFormMutation', () => ({
  useFormMutation: () => ({
    saving: false,
    mutate: (...args: any[]) => mutateMock(...args),
  }),
}))

describe('LanguagesTab', () => {
  beforeEach(() => {
    global.fetch = vi.fn()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  test('renders languages table', async () => {
    const mockLanguages = [
      { code: 'en', name: 'English', nativeName: 'English', direction: 'ltr' as const, bcp47Locale: 'en-US', enabled: true, featured: true, flag: '🇺🇸' },
      { code: 'ar', name: 'Arabic', nativeName: 'العربية', direction: 'rtl' as const, bcp47Locale: 'ar-AE', enabled: true, featured: false, flag: '🇦🇪' },
    ]

    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ data: mockLanguages }),
      } as Response)
    )

    render(
      <LocalizationProvider>
        <LanguagesTab />
      </LocalizationProvider>
    )

    await waitFor(() => {
      expect(screen.getByText('English')).toBeInTheDocument()
      expect(screen.getByText('العربية')).toBeInTheDocument()
    })
  })

  test('allows adding new language via modal', async () => {
    const user = userEvent.setup()

    global.fetch = vi.fn()
      .mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: [] }),
        } as Response)
      )
      .mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({}),
        } as Response)
      )
      .mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: [] }),
        } as Response)
      )

    render(
      <LocalizationProvider>
        <LanguagesTab />
      </LocalizationProvider>
    )

    const addButton = await screen.findByText(/Add Language/i)
    await user.click(addButton)

    await waitFor(() => {
      expect(screen.getByText('Quick Select Popular Language')).toBeInTheDocument()
    })

    const nameInput = screen.getByPlaceholderText('e.g. French')
    await user.type(nameInput, 'French')

    const codeInput = screen.getByPlaceholderText('e.g. fr')
    await user.type(codeInput, 'fr')

    const nativeInput = screen.getByPlaceholderText('e.g. Français')
    await user.type(nativeInput, 'Français')

    const localeInput = screen.getByPlaceholderText('e.g. fr-FR')
    await user.type(localeInput, 'fr-FR')

    const submitButton = screen.getAllByRole('button', { name: /Add Language/i })[1]
    await user.click(submitButton)

    await waitFor(() => {
      expect(mutateMock).toHaveBeenCalledWith(
        '/api/admin/languages',
        'POST',
        expect.objectContaining({ code: 'fr' }),
        expect.objectContaining({ invalidate: expect.any(Array) })
      )
    })
  })

  test('allows selecting popular language from dropdown', async () => {
    const user = userEvent.setup()

    global.fetch = vi.fn()
      .mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: [] }),
        } as Response)
      )
      .mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({}),
        } as Response)
      )
      .mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: [] }),
        } as Response)
      )

    render(
      <LocalizationProvider>
        <LanguagesTab />
      </LocalizationProvider>
    )

    const addButton = await screen.findByText(/Add Language/i)
    await user.click(addButton)

    await waitFor(() => {
      expect(screen.getByText('Quick Select Popular Language')).toBeInTheDocument()
    })

    const frenchButton = screen.getByText('Français')
    await user.click(frenchButton)

    await waitFor(() => {
      const codeInput = screen.getByDisplayValue('fr') as HTMLInputElement
      const nameInput = screen.getByDisplayValue('French') as HTMLInputElement
      expect(codeInput).toBeInTheDocument()
      expect(nameInput).toBeInTheDocument()
    })

    const submitButton = screen.getAllByRole('button', { name: /Add Language/i })[1]
    await user.click(submitButton)

    await waitFor(() => {
      expect(mutateMock).toHaveBeenCalledWith(
        '/api/admin/languages',
        'POST',
        expect.objectContaining({ code: 'fr' }),
        expect.objectContaining({ invalidate: expect.any(Array) })
      )
    })
  })

  test('allows exporting languages', async () => {
    const user = userEvent.setup()
    const mockLanguages = [
      { code: 'en', name: 'English', nativeName: 'English', direction: 'ltr' as const, bcp47Locale: 'en-US', enabled: true, featured: true },
    ]

    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ data: mockLanguages }),
      } as Response)
    )

    // Mock URL.createObjectURL and URL.revokeObjectURL
    global.URL.createObjectURL = vi.fn(() => 'blob:mock')
    global.URL.revokeObjectURL = vi.fn()

    render(
      <LocalizationProvider>
        <LanguagesTab />
      </LocalizationProvider>
    )

    const exportButton = await screen.findByText(/Export/i)
    await user.click(exportButton)

    await waitFor(() => {
      expect(global.URL.createObjectURL).toHaveBeenCalled()
    })
  })

  test('allows editing existing language', async () => {
    const user = userEvent.setup()
    const mockLanguages = [
      { code: 'fr', name: 'French', nativeName: 'Français', direction: 'ltr' as const, bcp47Locale: 'fr-FR', enabled: true, featured: false, flag: '🇫🇷' },
    ]

    global.fetch = vi.fn()
      .mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: mockLanguages }),
        } as Response)
      )
      .mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({}),
        } as Response)
      )
      .mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: mockLanguages }),
        } as Response)
      )

    render(
      <LocalizationProvider>
        <LanguagesTab />
      </LocalizationProvider>
    )

    const editButton = await screen.findByText(/Edit/i)
    await user.click(editButton)

    await waitFor(() => {
      expect(screen.getByText('Edit Language')).toBeInTheDocument()
    })

    const updateButton = screen.getByRole('button', { name: /Update/i })
    await user.click(updateButton)

    await waitFor(() => {
      expect(mutateMock).toHaveBeenCalledWith(
        '/api/admin/languages/fr',
        'PUT',
        expect.any(Object),
        expect.objectContaining({ invalidate: expect.any(Array) })
      )
    })
  })
})
